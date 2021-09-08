<script>
	import { onMount } from 'svelte'
    import { library, inited, trigger } from './_stores.js'
    import dragdrop from 'svelte-native-drag-drop'
    import rectd from './_rectd.js'

	export let project
	export let sprites

	let handles = []
	let elements = []

	let lastXY = {}

	$: (_project => {
		for (const name of project?.fileNames || []) {
			if (!project.layouts) project.layouts = {}
			if (!project.layouts[name]) project.layouts[name] = {}

			let { x, xOG, xRange, y, yOG, yRange, scale, scaleOG } = project?.layouts[name]?.values || {}
			let str = x + '-' + y + '-' + scale
			if ( (lastXY[name] != str || $trigger.offset) && sprites[name] ) {
				$trigger.offset = false
				lastXY[name] = str

				for (let sprite of sprites[name]) {
					sprite.transform.position.x = ( xOG + ( x * xRange )) * ( 1 + scale )
					sprite.transform.position.y = ( yOG + ( y * yRange )) * ( 1 + scale )
					sprite.transform.scale.x = sprite.transform.scale.y = scaleOG + scale
				}
			}
		}
	})( project )


	function onCollapse( name ) {
		project.layouts[name].collapsed = !project.layouts[name].collapsed
	}

	let muted = {}

	$: (_muted => {
		for (const [name, list] of Object.entries(sprites) ) {
			for (const sprite of list) {
				sprite.visible = !muted[name]
			}
		}
	})(muted)




	// let xes = {}
	// let yes = {}


	// let xesTimeout

	// $: ( (_xes, _yes) => {

	// 	if (xesTimeout) clearTimeout( xesTimeout )

	// 	xesTimeout = setTimeout( e => {

	// 		for (const [name, list] of Object.entries(sprites) ) {
	// 			for (const sprite of list) {
	// 				if (xes[name] == null || xes[name] == undefined) xes[name] = 0
	// 				if (yes[name] == null || yes[name] == undefined) yes[name] = 0
	// 				// sprite.x = xes[name]
	// 				// sprite.y = yes[name]
	// 			}
	// 		}
	// 	}, 1)
	// })( xes, yes )


</script>


	{#if !project.fileNames || project.fileNames.length == 0} 
		<div class="p1">
			<button on:click={e => ($library = true) }>Add Images</button>
		</div>
	{/if}
	{#each project.fileNames as name, idx}
		{#if sprites[name]}
		    <header 
		    	class="bb1-solid pop flex row-space-between-center rel">
		        <span 
		            class:none={Object.keys(sprites).length <= 1}
		            class="fill grabbable"
		            bind:this={handles[idx]} />
		        <div class="flex row-flex-start-center">
		            <div 
			            class:disabled={Object.keys(sprites).length <= 1}
		                class="plr1 move grabbable">
		                <span class="icon">drag_indicator</span>
		            </div>
		            {name}
		        </div>
		        <div class="flex row-flex-start-center z-index2  z-index2">

                    <div 
                        class="flex h2em w2em row-center-center mr0-5 pointer radius2em"
                        on:click={ e => muted[name] = !muted[name] }
                        class:error={muted[name]}
                        class:filled={muted[name]}>M</div>
		            <div 
		                class="grow flex row-flex-end-center pointer p1-5"
		                on:click={e => onCollapse( name )}>
		                <span 
		                    class:rotate90={project.layouts[name].collapsed}
		                    class="arrow" />
		            </div>


		        </div>
		    </header>


	        {#if !project.layouts[name].collapsed}
	        	<div class="p1 bb1-solid cmb0-5">
	        		{#if project.layouts[name].values}
	        			<div class="flex row-space-between-center">
		        			<span>X</span>
			        		<input 
			        			on:dblclick={ e => (project.layouts[name].values.x = 0) }
			        			class="rounded radius1em"
			        			bind:value={project.layouts[name].values.x}
			        			type="range" 
			        			min={-1} 
			        			max={1} 
			        			step="0.0001" 
		        					/>
        				</div>
	        			<div class="flex row-space-between-center">
		        			<span>Y</span>
			        		<input 
			        			on:dblclick={ e => (project.layouts[name].values.y = 0) }
			        			class="rounded radius1em"
			        			bind:value={project.layouts[name].values.y}
			        			type="range" 
			        			min={-1} 
			        			max={1} 
			        			step="0.0001" 
		        					/>
        				</div>
	        			<div class="flex row-space-between-center">
		        			<span class="icon">
		        				aspect_ratio
		        			</span>
			        		<input 
			        			on:dblclick={ e => (project.layouts[name].values.scale = 0) }
			        			class="rounded radius1em"
			        			bind:value={project.layouts[name].values.scale}
			        			type="range" 
			        			min={-0.5} 
			        			max={0.5} 
			        			step="0.0001" 
		        					/>
        				</div>
	        		{/if}
	        	</div>
	        {/if}
        {/if}
    {/each}