import { writable } from 'svelte/store';

export type Phase = 'lobby' | 'drawing' | 'voting' | 'result';
export type Player = { id: string; nickname: string; isHost: boolean; connected: boolean };
export type Stroke = { playerId: string; d: string };
export type RoomState = {
	id: string;
	phase: Phase;
	players: Player[];
	turnIndex: number;
	strokes: Stroke[];
};

export const roomStore = writable<RoomState | null>(null);
export const errorStore = writable<string>('');

export const setError = (msg: string) => errorStore.set(msg);
export const clearError = () => errorStore.set('');
