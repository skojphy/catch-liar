import { writable } from 'svelte/store';

export type Phase = 'lobby' | 'role_reveal' | 'drawing' | 'voting' | 'liar_guess' | 'result';
export type Player = {
	id: string;
	nickname: string;
	avatar: string;
	isHost: boolean;
	isLiar: boolean;
	connected: boolean;
	voteCount: number;
	cursor?: { x: number; y: number };
};
export type Stroke = { playerId: string; d: string; color: string; width: number; points?: { x: number; y: number }[] };
export type RoomState = {
	id: string;
	phase: Phase;
	players: Player[];
	category: string;
	keyword: string;
	liarId: string;
	round: number;
	turnIndex: number;
	strokes: Stroke[];
	winningTeam: 'CITIZEN' | 'LIAR' | null;
};

export const roomStore = writable<RoomState | null>(null);
export const errorStore = writable<string>('');

export const setError = (msg: string) => errorStore.set(msg);
export const clearError = () => errorStore.set('');
