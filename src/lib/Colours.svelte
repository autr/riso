<script>
	import _colours from './_colours.js'
	import { createEventDispatcher } from 'svelte'
	const dispatch = createEventDispatcher()
	export let overlay

	let colours = _colours()
	function onSelect( i ) {
		console.log(`[Colours] 🎨  selected ${i}`)
		dispatch( 'select', i )
	}

	let size = 40
	let count = 10
	let offset = 0.2

</script>



<!-- COLOURS OVERLAY -->

<div 
	class="flex fixed l0 t0 h100vh w100vw h100pc bl1-solid bt1-solid bg wrap overflow-auto z-index99"
	class:none={ !overlay }>
	{#each colours as c, i}
		<div 
			on:click={ e => onSelect(i) }
			class="h10em br1-solid bb1-solid flex column pointer no-basis grow minw20em clickable">
			<span 
				style={`background-color:rgb(${c.rgb}`}
				class:checkered={c.type == 'clear' }
				class="grow w100pc {c.type} swatch p1 flex row-flex-end-center">
				{#if c.type == 'fluo'}
					<svg width={size+'px'} height={size+'px'} viewBox="0 0 {size} {size}">
						{#each (new Array(count)) as idx, ii }
							<line 

								style={`
									stroke: var(--color);
									transform-origin: ${size/2}px ${size/2}px;
									transform: rotate(${(360/count)*ii}deg)
								`}
								x1="0" 
								y1={size/2} 
								x2={size * offset} 
								y2={size/2} />
						{/each}
					</svg>
				{/if}
			</span>

			<span 
				class="{c.type} bt1-solid flex row-space-between-center ptb0-5 plr1 wrap">
				<span>{c.name}</span>
				<span>{c.japanese || ''}</span>
			</span>
		</div>
	{/each}
	{#each new Array(10) as ii,i}
		<span class="flex column pointer no-basis grow minw20em clickable h0em" style="line-height:0px;max-height:0px" />
	{/each}
</div>