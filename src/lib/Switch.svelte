<script>

	export let value
</script>


<span 
	on:click={e => value = !value}
	class="bt1-solid bb1-solid bl1-solid flex row-flex-start-stretch pointer clickable">
	<span 
		class="rel bg block plr1-2 br1-solid">
		<span class:cross={value} class="fill" />
	</span>
	<span class="ptb0-5 pl1-5 pr2 br1-solid">
		<slot />
	</span>
</span>