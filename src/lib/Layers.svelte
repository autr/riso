<script>

    import { onMount, onDestroy } from 'svelte'
    import dragdrop from 'svelte-native-drag-drop'
    import Layer from './Layer.svelte'
    import Palette from './Palette.svelte'
    import { selected, solo, trigger } from './_stores.js'


    // onMount( async () => {
    // })

    // onDestroy( async () => {
    // })

    const moveInArray = (arr, from, to) => {
        if (to >= arr.length) {
            var k = to - arr.length + 1
            while (k--) {
                arr.push(undefined)
            }
        }
        arr.splice(to, 0, arr.splice(from, 1)[0])
        return arr
    }


    function resetDragDrop() {

        dragdrop.clear('layers')
        for (let i = 0; i < elements.length; i++) {
            let el = elements[i]
            let handle = handles[i]
            dragdrop.addDragArea( 'layers', handle, el )
            dragdrop.addDropArea( 'layers', el, {
                drop: onDrop
            })

        }
    }

    let lastLength = -1
    $: ((layers_, els_) => {
        if (lastLength != elements.length) {
            console.log(`[Layers] 🍰  resetting drag-drop handles for ${elements.length} elements and ${handles.length} handles`)
            lastLength = elements.length
            resetDragDrop()
        }
    })(layers, elements)

    export let layers
    export let inkLayerGroups
    export let inkLayerContainer

    let handles = []
    let elements = []


    function onCollapse(idx) {
        layers[idx].collapsed = !layers[idx].collapsed
    }

    function onDblCollapse( ) {
        for (let i = 0; i < layers.length; i++) layers[i].collapsed = true
        
    }

    function onSolo( idx ) {
        solo.set( $solo == idx ? null : idx )
    }

    $: (_solo => {
        for (let i = 0; i < layers.length; i++) layers[i].solo = $solo == i && $solo != null
    })($solo)

    function onSelect( idx ) {
        selected.set({
            type: 'layer',
            which: idx
        })
    }


    function onRemove( idx ) {
        let cp = layers.filter( (l,i) => (i != idx) )
        layers = []
        inkLayerGroups[idx].parent.removeChild( inkLayerGroups[idx] )
        inkLayerContainer.children = inkLayerContainer.children.filter( (l,i) => (i != idx) )
        setTimeout( e => (layers = cp), 1)
        
    }

    function onDrop(e) {
        // $trigger.palettes = true
        let source = elements.indexOf(e.source)
        let destination = elements.indexOf(e.destination)

        if (source == destination) return

        console.log(`[Layers] 🌸  drag dropped from ${source} to ${destination}`)

        let cp = layers
        layers = []
        cp = moveInArray( cp, source, destination )
        inkLayerContainer.children = moveInArray( inkLayerContainer.children, source, destination)
        inkLayerGroups = moveInArray( inkLayerGroups, source, destination)
    
        console.log(`[Layers] 🌸  resetting layers with 1ms delay...`)
        layers = cp 
        setTimeout( e => resetDragDrop(), 1)


    }

    let isPicking = {}
</script>



{#each inkLayerGroups as inkGroup, idx}
    {#if layers[idx]}
        <div 
            class:something={$selected.type == 'layer' && $selected.which == idx}
            on:click={ e => onSelect(idx) }
            bind:this={elements[idx]}>
            <header class="pop flex row-space-between-center rel">
                <span 
                    class="fill grabbable z-index1" 
                    bind:this={handles[idx]} />
                <div class="flex row-flex-start-center  z-index0">
                    <div 
                        class="plr1 move grabbable">
                        <span class="icon">drag_indicator</span>
                    </div>
                    Layer {idx + 1}
                </div>
                <div class="flex row-flex-start-center z-index2  z-index2">

                    <div 
                        class="flex h2em w2em row-center-center mr0-5 pointer radius2em"
                        on:click={ e => layers[idx].muted = !layers[idx].muted }
                        class:error={layers[idx].muted && $solo != idx}
                        class:filled={layers[idx].muted && $solo != idx}>M</div>
                    <div 
                        class="flex h2em w2em row-center-center mr0-5 pointer radius2em"
                        class:filled={$solo == idx}
                        class:alert={$solo == idx}
                        class:b1-solid={$solo == idx}
                        on:click={ e => onSolo( idx ) }>S</div>
                    <div 
                        class="flex h2em w2em row-center-center mr0-5 pointer radius2em"
                        on:click={ e => onRemove( idx ) }>
                        <!-- <span class="cross w10px h10px flex block" />    -->
                        <span class="icon t0 l0">clear</span>   
                    </div>
                    <div 
                        class="grow flex row-flex-end-center pointer p1-5"
                        on:dblclick={onDblCollapse}
                        on:click={e => onCollapse(idx)}>
                        <span 
                            class:rotate90={layers[idx].collapsed}
                            class="arrow" />
                    </div>


                </div>
            </header>

            <!-- PALETTE -->

            <aside 
                class="">
                <div 
                    on:click={ e => (isPicking[idx] = true) }
                    class="bb1-solid bt1-solid h1em flex row-reverse w100pc pointer">
                    <Palette bind:layer={layers[idx]} />
                </div>
            </aside>

            <Layer 
                bind:isPickingInk={isPicking[idx]}
                index={idx}
                {pixi}
                class={layers[idx].collapsed ? 'none' : ''}
                bind:inkGroup={inkGroup}
                bind:layer={layers[idx]} />
        </div>
    {/if}
{/each}