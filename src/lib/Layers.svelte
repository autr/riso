<script>

    import { onMount, onDestroy } from 'svelte'
    import dragdrop from 'svelte-native-drag-drop'
    import Layer from './Layer.svelte'
    import Palette from './Palette.svelte'
    import { selected } from './_stores.js'


    // onMount( async () => {
    // })

    // onDestroy( async () => {
    // })

    let lastLength = -1
    $: ((layers_, els_) => {
        if (lastLength != elements.length) {
            console.log(`[Layers] 🍰  resetting drag-drop handles`)
            lastLength = elements.length
            dragdrop.clear('layers')
            for (let i = 0; i < elements.length; i++) {
                let el = elements[i]
                let handle = handles[i]
                dragdrop.addDragArea( 'layers', handle, el )
                dragdrop.addDropArea( 'layers', el )

            }
        }
    })(layers, elements)

    export let solo
    export let layers
    export let groups

    let handles = []
    let elements = []


    function onCollapse(idx) {
        layers[idx].collapsed = !layers[idx].collapsed
    }

    function onSolo( idx ) {
        solo = solo == null ? idx : null
        layers[idx].solo = solo == idx && solo != null
    }

    function onSelect( idx ) {
        selected.set({
            type: 'layer',
            which: idx
        })
    }

    function onRemove( idx ) {
        groups[idx].parent.removeChild( groups[idx] )
        layers = layers.filter( (l,i) => (i != idx) )
    }
</script>



{#each groups as group, idx}
    {#if layers[idx]}
        <div 
            class:something={$selected.type == 'layer' && $selected.which == idx}
            on:click={ e => onSelect(idx) }
            bind:this={elements[idx]}>
            <header class="pop flex row-space-between-center rel">
                <span 
                    class="fill grabbable" 
                    bind:this={handles[idx]} />
                <div class="flex row-flex-start-center">
                    <div 
                        class="p1-5 move"
                        style="line-height:2px;max-width:10px">
                        ⁞⁞⁞
                    </div>
                </div>
                <div class="flex row-flex-start-center z-index2  z-index2">

                    <div 
                        class="flex h2em w2em row-center-center mr0-5 pointer radius2em"
                        on:click={ e => layers[idx].muted = !layers[idx].muted }
                        class:error={layers[idx].muted && solo != idx}
                        class:filled={layers[idx].muted && solo != idx}>M</div>
                    <div 
                        class="flex h2em w2em row-center-center mr0-5 pointer radius2em"
                        class:filled={solo == idx}
                        class:alert={solo == idx}
                        class:b1-solid={solo == idx}
                        on:click={ e => onSolo( idx ) }>S</div>
                    <div 
                        class="flex h2em w2em row-center-center mr0-5 pointer radius2em"
                        on:click={ e => onRemove( idx ) }>
                        <span class="cross w10px h10px flex block" />    
                    </div>
                    <div 
                        class="grow flex row-flex-end-center pointer p1-5"
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
                <div class="bb1-solid bt1-solid h1em flex row-reverse w100pc">
                    <Palette bind:layer={layers[idx]} />
                </div>
            </aside>

            <Layer 
                index={idx}
                {pixi}
                class={layers[idx].collapsed ? 'none' : ''}
                bind:group={group}
                bind:solo={solo}
                bind:layer={layers[idx]} />
        </div>
    {/if}
{/each}