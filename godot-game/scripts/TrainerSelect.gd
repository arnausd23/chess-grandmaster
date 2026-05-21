extends Control

# ─── Trainer data ────────────────────────────────────────────────────────────
const TRAINERS = [
	{
		"name": "Youngster",
		"ability": "Gain [color=#FF9900]3[/color] free rerolls every day",
		"sprite": "res://assets/trainers/youngster.png",
		"accent": Color(0.38, 0.55, 0.88),
	},
	{
		"name": "Bug Catcher",
		"ability": "The first [color=#66CC44]Bug[/color] monster you buy\neach round is free",
		"sprite": "res://assets/trainers/bug_catcher.png",
		"accent": Color(0.38, 0.72, 0.38),
	},
	{
		"name": "Lucky Girl",
		"ability": "[color=#DD88FF]SHINY[/color] monsters are more\nlikely to appear",
		"sprite": "res://assets/trainers/lucky_girl.png",
		"accent": Color(0.88, 0.38, 0.55),
	},
]

# ─── Colors ──────────────────────────────────────────────────────────────────
const C_BG          = Color(0.04, 0.04, 0.04)
const C_CARD_BG     = Color(0.96, 0.96, 0.94)
const C_HEADER_BG   = Color(0.96, 0.78, 0.12)
const C_BORDER_IDLE = Color(0.28, 0.28, 0.28)
const C_BORDER_SEL  = Color(0.95, 0.55, 0.08)
const C_BORDER_HOV  = Color(0.80, 0.80, 0.80)
const C_PORTRAIT_BG = Color(0.90, 0.90, 0.88)
const C_DESC_BG     = Color(1.0,  1.0,  1.0)
const C_DIALOG_BG   = Color(1.0,  1.0,  1.0)
const C_DIALOG_BOR  = Color(0.85, 0.25, 0.40)
const C_TEXT_DARK   = Color(0.12, 0.12, 0.12)
const C_TEXT_HEADER = Color(0.08, 0.08, 0.08)

const CARD_W   = 270
const CARD_H   = 420
const CARD_GAP = 30

var _selected: int = 1
var _cards: Array = []

# ─── Build UI ────────────────────────────────────────────────────────────────

func _ready() -> void:
	_build_ui()

func _build_ui() -> void:
	# Full-screen black background
	var bg := ColorRect.new()
	bg.color = C_BG
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	# Root VBox
	var root := VBoxContainer.new()
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.add_theme_constant_override("separation", 24)
	root.alignment = BoxContainer.ALIGNMENT_CENTER
	add_child(root)

	# ── cards row ────────────────────────────────────────────────────────────
	var cards_row := HBoxContainer.new()
	cards_row.alignment = BoxContainer.ALIGNMENT_CENTER
	cards_row.add_theme_constant_override("separation", CARD_GAP)
	cards_row.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	root.add_child(cards_row)

	for i in range(TRAINERS.size()):
		var card := _make_card(i)
		_cards.append(card)
		cards_row.add_child(card)

	# ── bottom dialog ────────────────────────────────────────────────────────
	var dialog := _make_dialog()
	root.add_child(dialog)

	_refresh_selection()

# ─── Card factory ────────────────────────────────────────────────────────────

func _make_card(idx: int) -> Panel:
	var data := TRAINERS[idx]

	# Outer panel (acts as border frame)
	var card := Panel.new()
	card.custom_minimum_size = Vector2(CARD_W, CARD_H)
	card.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	_apply_card_style(card, C_BORDER_IDLE, 3)

	# Mouse events
	card.mouse_entered.connect(_on_card_hover.bind(idx, true))
	card.mouse_exited.connect(_on_card_hover.bind(idx, false))
	card.gui_input.connect(_on_card_click.bind(idx))

	var vbox := VBoxContainer.new()
	vbox.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	vbox.add_theme_constant_override("separation", 0)
	card.add_child(vbox)

	# ── header ───────────────────────────────────────────────────────────────
	var header := Panel.new()
	header.custom_minimum_size = Vector2(CARD_W, 38)
	_apply_flat_style(header, C_HEADER_BG, Color.TRANSPARENT, 0,
					  Vector4i(4, 4, 0, 0))
	vbox.add_child(header)

	var name_lbl := Label.new()
	name_lbl.text = data["name"]
	name_lbl.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	name_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	name_lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	name_lbl.add_theme_color_override("font_color", C_TEXT_HEADER)
	name_lbl.add_theme_font_size_override("font_size", 18)
	header.add_child(name_lbl)

	# ── portrait ─────────────────────────────────────────────────────────────
	var portrait_panel := Panel.new()
	portrait_panel.custom_minimum_size = Vector2(CARD_W, 250)
	portrait_panel.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_apply_flat_style(portrait_panel, C_PORTRAIT_BG, Color(0.75,0.75,0.72), 1)
	vbox.add_child(portrait_panel)

	var tex_rect := TextureRect.new()
	tex_rect.texture = load(data["sprite"])
	tex_rect.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	tex_rect.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	tex_rect.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	tex_rect.offset_left   =  8
	tex_rect.offset_top    =  8
	tex_rect.offset_right  = -8
	tex_rect.offset_bottom = -8
	portrait_panel.add_child(tex_rect)

	# ── description ──────────────────────────────────────────────────────────
	var desc_panel := Panel.new()
	desc_panel.custom_minimum_size = Vector2(CARD_W, 100)
	_apply_flat_style(desc_panel, C_DESC_BG, Color(0.82,0.82,0.80), 1,
					  Vector4i(0, 0, 4, 4))
	vbox.add_child(desc_panel)

	var desc_lbl := RichTextLabel.new()
	desc_lbl.bbcode_enabled = true
	desc_lbl.text = data["ability"]
	desc_lbl.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	desc_lbl.offset_left   = 12
	desc_lbl.offset_top    = 10
	desc_lbl.offset_right  = -12
	desc_lbl.offset_bottom = -10
	desc_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	desc_lbl.add_theme_font_size_override("normal_font_size", 15)
	desc_lbl.add_theme_color_override("default_color", C_TEXT_DARK)
	desc_lbl.scroll_active = false
	desc_panel.add_child(desc_lbl)

	return card

# ─── Dialog bar ──────────────────────────────────────────────────────────────

func _make_dialog() -> Panel:
	var panel := Panel.new()
	panel.custom_minimum_size = Vector2(900, 110)
	panel.size_flags_horizontal = Control.SIZE_SHRINK_CENTER

	var style := StyleBoxFlat.new()
	style.bg_color = C_DIALOG_BG
	style.border_color = C_DIALOG_BOR
	style.set_border_width_all(4)
	style.set_corner_radius_all(6)
	panel.add_theme_stylebox_override("panel", style)

	var lbl := Label.new()
	lbl.text = "Select a trainer to begin your journey."
	lbl.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	lbl.add_theme_font_size_override("font_size", 28)
	lbl.add_theme_color_override("font_color", C_TEXT_DARK)
	panel.add_child(lbl)

	return panel

# ─── Style helpers ───────────────────────────────────────────────────────────

func _apply_card_style(panel: Panel, border_color: Color,
		border_width: int, corner: int = 6) -> void:
	var style := StyleBoxFlat.new()
	style.bg_color = C_CARD_BG
	style.border_color = border_color
	style.set_border_width_all(border_width)
	style.set_corner_radius_all(corner)
	panel.add_theme_stylebox_override("panel", style)

func _apply_flat_style(panel: Panel, bg: Color, border: Color,
		bw: int, corners: Vector4i = Vector4i(0,0,0,0)) -> void:
	var style := StyleBoxFlat.new()
	style.bg_color = bg
	style.border_color = border
	style.set_border_width_all(bw)
	style.corner_radius_top_left     = corners.x
	style.corner_radius_top_right    = corners.y
	style.corner_radius_bottom_right = corners.z
	style.corner_radius_bottom_left  = corners.w
	panel.add_theme_stylebox_override("panel", style)

# ─── Selection / hover ───────────────────────────────────────────────────────

func _refresh_selection() -> void:
	for i in range(_cards.size()):
		var border := C_BORDER_SEL if i == _selected else C_BORDER_IDLE
		var bw     := 4           if i == _selected else 2
		_apply_card_style(_cards[i], border, bw)

		# Scale up selected card slightly
		var tween := create_tween()
		var target_scale := Vector2(1.04, 1.04) if i == _selected else Vector2(1.0, 1.0)
		tween.tween_property(_cards[i], "scale", target_scale, 0.12) \
			 .set_trans(Tween.TRANS_CUBIC).set_ease(Tween.EASE_OUT)
		_cards[i].pivot_offset = _cards[i].custom_minimum_size * 0.5

func _on_card_hover(idx: int, entered: bool) -> void:
	if idx == _selected:
		return
	var border := C_BORDER_HOV if entered else C_BORDER_IDLE
	_apply_card_style(_cards[idx], border, 2)

func _on_card_click(event: InputEvent, idx: int) -> void:
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT \
			and event.pressed:
		_selected = idx
		_refresh_selection()
		await get_tree().create_timer(0.25).timeout
		_go_to_main(idx)

func _go_to_main(trainer_idx: int) -> void:
	# Pass trainer index via autoload or scene meta
	get_tree().root.set_meta("selected_trainer", trainer_idx)
	get_tree().change_scene_to_file("res://scenes/MainGame.tscn")
