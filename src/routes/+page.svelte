<script lang="ts">
	import { onMount } from 'svelte';
	import { getSocket } from '$lib/socket';

	let status = 'disconnected';
	let last = '';

	onMount(() => {
		const s = getSocket();

		const onConnect = () => (status = `connected: ${s.id}`);
		const onDisconnect = () => (status = 'disconnected');

		s.on('connect', onConnect);
		s.on('disconnect', onDisconnect);

		s.on('pong', () => {
			last = `pong @ ${new Date().toLocaleTimeString()}`;
		});

		return () => {
			s.off('connect', onConnect);
			s.off('disconnect', onDisconnect);
			s.off('pong');
		};
	});

	function ping() {
		getSocket().emit('ping');
	}
</script>

<div style="padding: 16px">
	<h1>Catch Liar</h1>
	<p>status: {status}</p>

	<button on:click={ping}>ping</button>
	<p>{last}</p>
</div>
