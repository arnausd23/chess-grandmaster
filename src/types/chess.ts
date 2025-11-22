export interface TitledPlayersResponse {
  players: string[];
}

export interface PlayerProfile {
  avatar?: string;
  player_id: number;
  username: string;
  url: string;
  name?: string;
  title?: string;
  followers: number;
  country?: string;
  location?: string;
  last_online: number;
  joined: number;
  status?: string;
  is_streamer: boolean;
  verified: boolean;
  league?: string;
  streaming_platforms?: {
    twitch?: {
      channel: string;
      channel_url: string;
    };
    youtube?: {
      channel: string;
      channel_url: string;
    };
  };
  fide?: number;
}

export interface PlayerStats {
  last?: {
    rating: number;
    date: number;
    rd: number;
    game: string;
  };
  best?: {
    rating: number;
    date: number;
    game: string;
  };
  record?: {
    win: number;
    loss: number;
    draw: number;
  };
  tournament?: {
    points: number;
    games: number;
  };
}

