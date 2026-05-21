extends Control

# ─── Constants ───────────────────────────────────────────────────────────────
const C_BG_TOP    = Color(0.22, 0.52, 0.60)
const C_BG_BOT    = Color(0.18, 0.44, 0.52)
const C_HUD_BG    = Color(0.16, 0.38, 0.46)
const C_HUD_LINE  = Color(0.12, 0.28, 0.36)
const C_PANEL_BG  = Color(0.95, 0.95, 0.92)
const C_PANEL_BOR = Color(0.82, 0.82, 0.78)
const C_HEADER_Y  = Color(0.96, 0.78, 0.12)
const C_HEADER_P  = Color(0.85, 0.25, 0.40)  # pink/red for My Team
const C_WHITE     = Color(1.0, 1.0, 1.0)
const C_DARK      = Color(0.10, 0.10, 0.10)
const C_SLOT_BG   = Color(0.98, 0.98, 0.96)
const C_SLOT_BOR  = Color(0.80, 0.80, 0.76)
const C_SHOP_BG   = Color(0.70, 0.80, 0.50)   # greenish shop slot
const C_SHOP_BOR  = Color(0.55, 0.65, 0.38)
const C_GOLD_BTN  = Color(0.96, 0.78, 0.12)
const C_RED_BTN   = Color(0.85, 0.25, 0.40)
const C_LOCK_BTN  = Color(0.96, 0.78, 0.12)
const C_HP_GREEN  = Color(0.22, 0.78, 0.22)
const C_HP_BG     = Color(0.25, 0.25, 0.25)
const C_DIAMOND_BG = Color(0.18, 0.44, 0.52)

const TRAINERS = [
	{"name": "Youngster", "sprite": "res://assets/trainers/youngster.png",
	 "ability": "Gain [color=#FF9900]3[/color] free rerolls every day"},
	{"name": "Bug Catcher", "sprite": "res://assets/trainers/bug_catcher.png",
	 "ability": "The first [color=#66CC44]Bug[/color] monster\nyou buy each round is free"},
	{"name": "Lucky Girl",  "sprite": "res://assets/trainers/lucky_girl.png",
	 "ability": "[color=#DD88FF]SHINY[/color] monsters are more\nlikely to appear"},
]

const SHOP_ITEMS = [
	{"name": "Mosslug",   "sprite": "res://assets/monsters/mosslug.png",
	 "price": 15, "power": "30",  "bg": Color(0.52, 0.68, 0.42)},
	{"name": "Venopuff",  "sprite": "res://assets/monsters/venopuff.png",
	 "price": 15, "power": "5",   "bg": Color(0.55, 0.42, 0.72)},
	{"name": "Spinarai",  "sprite": "res://assets/monsters/spinarai.png",
	 "price": 10, "power": "3/1", "bg": Color(0.68, 0.50, 0.38)},
	{"name": "Pebbler",   "sprite": "res://assets/monsters/pebbler.png",
	 "price": 15, "power": "20",  "bg": Color(0.62, 0.56, 0.46)},
	{"name": "Fake Coin", "sprite": "res://assets/monsters/fake_coin.png",
	 "price":  0, "power": "",    "bg": Color(0.68, 0.60, 0.42), "item": true},
]

var _trainer_idx: int = 0
var _day: int = 1
var _hp: int = 10
var _gold: int = 0
var _gold_max: int = 10
var _shop_locked: bool = false

# ─── Build ───────────────────────────────────────────────────────────────────

func _ready() -> void:
	if get_tree().root.has_meta("selected_trainer"):
		_trainer_idx = get_tree().root.get_meta("selected_trainer")
	_build_ui()

func _build_ui() -> void:
	# Tiled background
	var bg := _make_tiled_bg()
	add_child(bg)

	# Root layout: VBox stacked top-to-bottom
	var root := VBoxContainer.new()
	root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	root.add_theme_constant_override("separation", 0)
	add_child(root)

	# ── Top HUD bar ─────────────────────────────────────────────────────────
	root.add_child(_make_hud())

	# ── Content row ─────────────────────────────────────────────────────────
	var content := HBoxContainer.new()
	content.size_flags_vertical = Control.SIZE_EXPAND_FILL
	content.add_theme_constant_override("separation", 10)
	root.add_child(content)

	# Left margin
	var lm := Control.new(); lm.custom_minimum_size = Vector2(8, 0)
	content.add_child(lm)

	# Left panel: trainer info
	content.add_child(_make_trainer_panel())

	# Center: bench + team
	content.add_child(_make_center_panel())

	# Right margin (flexible)
	var rm := Control.new()
	rm.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	content.add_child(rm)

	# ── Shop bar ────────────────────────────────────────────────────────────
	root.add_child(_make_shop_bar())

# ─── Tiled diamond background ────────────────────────────────────────────────

func _make_tiled_bg() -> Control:
	var c := ColorRect.new()
	c.color = C_BG_TOP
	c.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	return c

# ─── HUD bar ─────────────────────────────────────────────────────────────────

func _make_hud() -> Panel:
	var panel := Panel.new()
	panel.custom_minimum_size = Vector2(0, 56)

	var style := StyleBoxFlat.new()
	style.bg_color = C_HUD_BG
	style.border_color = C_HUD_LINE
	style.border_width_bottom = 3
	panel.add_theme_stylebox_override("panel", style)

	var hbox := HBoxContainer.new()
	hbox.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	hbox.offset_left   = 10
	hbox.offset_right  = -10
	hbox.alignment = BoxContainer.ALIGNMENT_CENTER
	panel.add_child(hbox)

	# Bag icon
	hbox.add_child(_icon_btn("🎒", 40))

	hbox.add_child(_hud_spacer(20))

	# HP
	var hp_box := HBoxContainer.new()
	hp_box.add_theme_constant_override("separation", 6)
	hbox.add_child(hp_box)
	hp_box.add_child(_hud_icon("❤", Color(0.9, 0.2, 0.3), 24))
	hp_box.add_child(_hud_label(str(_hp), 22))

	hbox.add_child(_hud_spacer(30))

	# Day
	hbox.add_child(_hud_label("DAY %d" % _day, 26, true))

	hbox.add_child(_hud_spacer(30))

	# Gold
	var gold_box := HBoxContainer.new()
	gold_box.add_theme_constant_override("separation", 6)
	hbox.add_child(gold_box)
	gold_box.add_child(_hud_icon("🪙", Color(0.96, 0.78, 0.12), 22))
	gold_box.add_child(_hud_label("%d/%d" % [_gold, _gold_max], 20))

	hbox.add_child(_hud_spacer(30, true))

	# Right icons
	hbox.add_child(_icon_btn("📖", 36))
	hbox.add_child(_hud_spacer(8))
	hbox.add_child(_icon_btn("⚙", 36))
	hbox.add_child(_hud_spacer(8))
	hbox.add_child(_icon_btn("⏏", 36, Color(0.9, 0.2, 0.3)))

	return panel

func _hud_spacer(w: float, expand: bool = false) -> Control:
	var c := Control.new()
	c.custom_minimum_size = Vector2(w, 0)
	if expand:
		c.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	return c

func _hud_label(text: String, size: int, bold: bool = false) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_color_override("font_color", C_WHITE)
	l.add_theme_font_size_override("font_size", size)
	l.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	return l

func _hud_icon(icon: String, color: Color, size: int) -> Label:
	var l := Label.new()
	l.text = icon
	l.add_theme_color_override("font_color", color)
	l.add_theme_font_size_override("font_size", size)
	l.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	return l

func _icon_btn(icon: String, size: int, color: Color = C_WHITE) -> Button:
	var b := Button.new()
	b.text = icon
	b.flat = true
	b.add_theme_color_override("font_color", color)
	b.add_theme_font_size_override("font_size", size)
	b.custom_minimum_size = Vector2(size + 10, size + 10)
	return b

# ─── Left trainer panel ───────────────────────────────────────────────────────

func _make_trainer_panel() -> Panel:
	var data := TRAINERS[_trainer_idx]

	var panel := Panel.new()
	panel.custom_minimum_size = Vector2(210, 0)
	panel.size_flags_vertical = Control.SIZE_EXPAND_FILL
	_stylebox(panel, Color(0.16, 0.38, 0.46, 0.7), Color.TRANSPARENT, 0,
			  Vector4i(0,0,0,0))

	var vbox := VBoxContainer.new()
	vbox.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	vbox.add_theme_constant_override("separation", 0)
	panel.add_child(vbox)

	# Name header
	var hdr := Panel.new()
	hdr.custom_minimum_size = Vector2(0, 32)
	_stylebox(hdr, C_HEADER_Y, Color.TRANSPARENT, 0)
	var hdr_lbl := Label.new()
	hdr_lbl.text = data["name"]
	hdr_lbl.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	hdr_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	hdr_lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	hdr_lbl.offset_left = 8
	hdr_lbl.add_theme_font_size_override("font_size", 14)
	hdr_lbl.add_theme_color_override("font_color", C_DARK)
	hdr.add_child(hdr_lbl)
	vbox.add_child(hdr)

	# Portrait
	var portrait := Panel.new()
	portrait.custom_minimum_size = Vector2(0, 200)
	_stylebox(portrait, C_PANEL_BG, C_PANEL_BOR, 2)
	var tex := TextureRect.new()
	tex.texture = load(data["sprite"])
	tex.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	tex.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	tex.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	tex.offset_left = 4; tex.offset_top = 4
	tex.offset_right = -4; tex.offset_bottom = -4
	portrait.add_child(tex)
	vbox.add_child(portrait)

	# Ability text
	var ability_panel := Panel.new()
	ability_panel.custom_minimum_size = Vector2(0, 80)
	_stylebox(ability_panel, C_WHITE, C_PANEL_BOR, 1)
	var rtl := RichTextLabel.new()
	rtl.bbcode_enabled = true
	rtl.text = data["ability"]
	rtl.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	rtl.offset_left = 8; rtl.offset_top = 6
	rtl.offset_right = -8; rtl.offset_bottom = -6
	rtl.add_theme_font_size_override("normal_font_size", 13)
	rtl.add_theme_color_override("default_color", C_DARK)
	rtl.scroll_active = false
	ability_panel.add_child(rtl)
	vbox.add_child(ability_panel)

	# Spacer
	var sp := Control.new()
	sp.size_flags_vertical = Control.SIZE_EXPAND_FILL
	vbox.add_child(sp)

	# HP bar
	vbox.add_child(_make_hp_bar())

	return panel

func _make_hp_bar() -> Panel:
	var outer := Panel.new()
	outer.custom_minimum_size = Vector2(0, 34)
	_stylebox(outer, C_HEADER_Y, Color.TRANSPARENT, 0)

	var hbox := HBoxContainer.new()
	hbox.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	hbox.offset_left = 6; hbox.offset_right = -6
	hbox.add_theme_constant_override("separation", 6)
	outer.add_child(hbox)

	var lbl := Label.new()
	lbl.text = "HP"
	lbl.add_theme_font_size_override("font_size", 14)
	lbl.add_theme_color_override("font_color", C_DARK)
	lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	hbox.add_child(lbl)

	# Bar background
	var bar_bg := Panel.new()
	bar_bg.custom_minimum_size = Vector2(0, 18)
	bar_bg.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_stylebox(bar_bg, C_HP_BG, Color.TRANSPARENT, 0)

	# Bar fill (300 hp displayed)
	var bar_fill := Panel.new()
	bar_fill.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	bar_fill.offset_right = 0  # full bar for now
	_stylebox(bar_fill, C_HP_GREEN, Color.TRANSPARENT, 0)
	bar_bg.add_child(bar_fill)

	# HP number
	var hp_lbl := Label.new()
	hp_lbl.text = "300"
	hp_lbl.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	hp_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	hp_lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	hp_lbl.add_theme_font_size_override("font_size", 12)
	hp_lbl.add_theme_color_override("font_color", C_WHITE)
	bar_bg.add_child(hp_lbl)
	hbox.add_child(bar_bg)

	return outer

# ─── Center panel (bench + team) ─────────────────────────────────────────────

func _make_center_panel() -> VBoxContainer:
	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 10)
	vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	vbox.size_flags_vertical   = Control.SIZE_EXPAND_FILL

	# Top spacer
	var sp := Control.new()
	sp.custom_minimum_size = Vector2(0, 6)
	vbox.add_child(sp)

	# BENCH
	vbox.add_child(_make_slot_grid("BENCH", 5, 1, C_HEADER_Y, 100, 100))

	# Spacer
	var sp2 := Control.new()
	sp2.custom_minimum_size = Vector2(0, 8)
	vbox.add_child(sp2)

	# MY TEAM
	vbox.add_child(_make_slot_grid("MY TEAM", 3, 2, C_HEADER_P, 100, 100))

	var sp3 := Control.new()
	sp3.size_flags_vertical = Control.SIZE_EXPAND_FILL
	vbox.add_child(sp3)

	return vbox

func _make_slot_grid(title: String, cols: int, rows: int,
		header_color: Color, slot_w: int, slot_h: int) -> Panel:
	var outer := Panel.new()
	outer.size_flags_horizontal = Control.SIZE_EXPAND_FILL

	var style := StyleBoxFlat.new()
	style.bg_color = C_PANEL_BG
	style.border_color = C_PANEL_BOR
	style.set_border_width_all(2)
	style.set_corner_radius_all(4)
	outer.add_theme_stylebox_override("panel", style)

	var vbox := VBoxContainer.new()
	vbox.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	vbox.add_theme_constant_override("separation", 0)
	outer.add_child(vbox)

	# Header
	var hdr := Panel.new()
	hdr.custom_minimum_size = Vector2(0, 30)
	_stylebox(hdr, header_color, Color.TRANSPARENT, 0, Vector4i(4, 4, 0, 0))
	var hdr_lbl := Label.new()
	hdr_lbl.text = title
	hdr_lbl.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	hdr_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	hdr_lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	hdr_lbl.offset_left = 10
	hdr_lbl.add_theme_font_size_override("font_size", 13)
	hdr_lbl.add_theme_color_override("font_color", C_DARK)
	hdr.add_child(hdr_lbl)
	vbox.add_child(hdr)

	# Grid rows
	for r in range(rows):
		var row := HBoxContainer.new()
		row.add_theme_constant_override("separation", 4)
		row.size_flags_horizontal = Control.SIZE_EXPAND_FILL

		var row_wrap := Control.new()
		row_wrap.custom_minimum_size = Vector2(0, slot_h + 8)
		row_wrap.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		vbox.add_child(row_wrap)
		row.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		row.offset_left = 6; row.offset_right = -6
		row.offset_top = 4;  row.offset_bottom = -4
		row_wrap.add_child(row)

		for c in range(cols):
			var slot := Panel.new()
			slot.custom_minimum_size = Vector2(slot_w, slot_h)
			slot.size_flags_horizontal = Control.SIZE_EXPAND_FILL
			slot.size_flags_vertical   = Control.SIZE_EXPAND_FILL

			var ss := StyleBoxFlat.new()
			ss.bg_color = C_SLOT_BG
			ss.border_color = C_SLOT_BOR
			ss.set_border_width_all(2)
			ss.set_corner_radius_all(3)
			slot.add_theme_stylebox_override("panel", ss)
			row.add_child(slot)

	return outer

# ─── Shop bar ────────────────────────────────────────────────────────────────

func _make_shop_bar() -> Panel:
	var bar := Panel.new()
	bar.custom_minimum_size = Vector2(0, 130)
	_stylebox(bar, C_HUD_BG, C_HUD_LINE, 2)

	var hbox := HBoxContainer.new()
	hbox.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	hbox.offset_left = 8; hbox.offset_right = -8
	hbox.offset_top = 8;  hbox.offset_bottom = -8
	hbox.add_theme_constant_override("separation", 8)
	bar.add_child(hbox)

	# ── REROLL button ────────────────────────────────────────────────────────
	hbox.add_child(_make_big_btn("REROLL\n$3", C_GOLD_BTN, Color(0.08,0.08,0.08), 90, 110))

	# ── Rank/filter row + shop items ─────────────────────────────────────────
	var shop_vbox := VBoxContainer.new()
	shop_vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	shop_vbox.add_theme_constant_override("separation", 4)
	hbox.add_child(shop_vbox)

	# Filter bar
	shop_vbox.add_child(_make_filter_bar())

	# Item row
	var items_row := HBoxContainer.new()
	items_row.add_theme_constant_override("separation", 6)
	items_row.size_flags_vertical = Control.SIZE_EXPAND_FILL
	shop_vbox.add_child(items_row)

	for item in SHOP_ITEMS:
		items_row.add_child(_make_shop_slot(item))

	# ── Middle: gold display + LOCK ──────────────────────────────────────────
	var mid_vbox := VBoxContainer.new()
	mid_vbox.add_theme_constant_override("separation", 6)
	mid_vbox.custom_minimum_size = Vector2(90, 0)
	hbox.add_child(mid_vbox)

	var gold_btn := _make_big_btn("$30", C_RED_BTN, C_WHITE, 90, 50)
	mid_vbox.add_child(gold_btn)

	var lock_btn := _make_big_btn("LOCK", C_LOCK_BTN, C_DARK, 90, 40)
	mid_vbox.add_child(lock_btn)

	# ── BATTLE button ────────────────────────────────────────────────────────
	hbox.add_child(_make_big_btn("BATTLE!", C_RED_BTN, C_WHITE, 100, 110))

	return bar

func _make_filter_bar() -> Panel:
	var panel := Panel.new()
	panel.custom_minimum_size = Vector2(0, 28)
	_stylebox(panel, Color(0.14, 0.32, 0.40), Color.TRANSPARENT, 0)

	var hbox := HBoxContainer.new()
	hbox.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	hbox.offset_left = 4; hbox.offset_right = -4
	hbox.add_theme_constant_override("separation", 10)
	panel.add_child(hbox)

	var rank_lbl := Label.new()
	rank_lbl.text = "Rank 1"
	rank_lbl.add_theme_color_override("font_color", C_WHITE)
	rank_lbl.add_theme_font_size_override("font_size", 12)
	rank_lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	hbox.add_child(rank_lbl)

	# Type icons (colored squares with %)
	var type_data := [
		{"icon": "♦", "color": Color(0.9,0.9,0.9), "pct": "100"},
		{"icon": "♦", "color": Color(0.3,0.8,0.3), "pct": "0"},
		{"icon": "♦", "color": Color(0.3,0.5,0.9), "pct": "0"},
		{"icon": "♦", "color": Color(0.7,0.3,0.9), "pct": "0"},
		{"icon": "♦", "color": Color(0.9,0.6,0.2), "pct": "0"},
	]

	for td in type_data:
		var chip := Label.new()
		chip.text = "%s%s%%" % [td["icon"], td["pct"]]
		chip.add_theme_color_override("font_color", td["color"])
		chip.add_theme_font_size_override("font_size", 12)
		chip.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		hbox.add_child(chip)

	return panel

func _make_shop_slot(item: Dictionary) -> Panel:
	var slot := Panel.new()
	slot.custom_minimum_size = Vector2(90, 0)
	slot.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	slot.size_flags_vertical   = Control.SIZE_EXPAND_FILL

	var style := StyleBoxFlat.new()
	style.bg_color = item.get("bg", C_SHOP_BG)
	style.border_color = C_SHOP_BOR
	style.set_border_width_all(2)
	style.set_corner_radius_all(4)
	slot.add_theme_stylebox_override("panel", style)

	var vbox := VBoxContainer.new()
	vbox.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	vbox.offset_left = 3; vbox.offset_right = -3
	vbox.offset_top = 3;  vbox.offset_bottom = -3
	vbox.add_theme_constant_override("separation", 2)
	slot.add_child(vbox)

	# Item badge (ITEM label if it's an item)
	if item.get("item", false):
		var badge := Label.new()
		badge.text = "ITEM"
		badge.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
		badge.add_theme_font_size_override("font_size", 10)
		badge.add_theme_color_override("font_color", Color(0.9, 0.5, 0.1))
		vbox.add_child(badge)
	elif item["power"] != "":
		var pw := Label.new()
		pw.text = item["power"]
		pw.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
		pw.add_theme_font_size_override("font_size", 10)
		pw.add_theme_color_override("font_color", C_WHITE)
		vbox.add_child(pw)
	else:
		vbox.add_child(Control.new())

	# Sprite
	var tex := TextureRect.new()
	tex.texture = load(item["sprite"])
	tex.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	tex.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	tex.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	tex.size_flags_vertical   = Control.SIZE_EXPAND_FILL
	vbox.add_child(tex)

	# Name
	var name_lbl := Label.new()
	name_lbl.text = item["name"]
	name_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	name_lbl.add_theme_font_size_override("font_size", 10)
	name_lbl.add_theme_color_override("font_color", C_WHITE)
	vbox.add_child(name_lbl)

	# Price
	var price_lbl := Label.new()
	var price_str := "$%d" % item["price"] if item["price"] > 0 else "$0"
	price_lbl.text = price_str
	price_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	price_lbl.add_theme_font_size_override("font_size", 11)
	price_lbl.add_theme_color_override("font_color", C_WHITE)
	vbox.add_child(price_lbl)

	# Hover highlight
	slot.mouse_entered.connect(func():
		style.border_color = Color(1.0, 1.0, 0.4)
		style.border_width_left = 3
		style.border_width_right = 3
		style.border_width_top = 3
		style.border_width_bottom = 3)
	slot.mouse_exited.connect(func():
		style.border_color = C_SHOP_BOR
		style.set_border_width_all(2))

	return slot

func _make_big_btn(text: String, bg: Color, fg: Color, w: int, h: int) -> Button:
	var btn := Button.new()
	btn.text = text
	btn.custom_minimum_size = Vector2(w, h)

	var style := StyleBoxFlat.new()
	style.bg_color = bg
	style.set_border_width_all(2)
	style.border_color = bg.darkened(0.25)
	style.set_corner_radius_all(5)
	btn.add_theme_stylebox_override("normal", style)

	var hover := style.duplicate()
	hover.bg_color = bg.lightened(0.1)
	btn.add_theme_stylebox_override("hover", hover)

	var pressed_s := style.duplicate()
	pressed_s.bg_color = bg.darkened(0.15)
	btn.add_theme_stylebox_override("pressed", pressed_s)

	btn.add_theme_color_override("font_color", fg)
	btn.add_theme_font_size_override("font_size", 16)
	return btn

# ─── Style helper ────────────────────────────────────────────────────────────

func _stylebox(panel: Panel, bg: Color, border: Color, bw: int,
		corners: Vector4i = Vector4i(4,4,4,4)) -> void:
	var style := StyleBoxFlat.new()
	style.bg_color = bg
	style.border_color = border
	style.set_border_width_all(bw)
	style.corner_radius_top_left     = corners.x
	style.corner_radius_top_right    = corners.y
	style.corner_radius_bottom_right = corners.z
	style.corner_radius_bottom_left  = corners.w
	panel.add_theme_stylebox_override("panel", style)
