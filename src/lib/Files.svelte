<script>
    import { onMount } from 'svelte'
    import { library, inited, trigger, incompatible, warning } from './_stores.js'
    import utils from './_utils.js'
    import dragdrop from 'svelte-native-drag-drop'
    import rectd from './_rectd.js'
    import Switch from './Switch.svelte'
    import db from './_db.js'

    export let filesBin
    export let project


    onMount( async e => {
        console.log(`[Files] 🗄  requesting filesBin...`)
        await onRequestAll()
    } )

    let CANDIDATES = {}
    let allowMultiple = true

    $: totalCandidates = (Object.values( CANDIDATES ).filter( c => c ).length)

    $: ( am => {
        let total = (Object.values( CANDIDATES ).filter( c => c ).length)
        if (!allowMultiple && total > 1) {
            let b = false
            Object.keys(CANDIDATES).forEach( name => {
                if ( CANDIDATES[name] && !b ) {
                    b = true
                } else {
                    CANDIDATES[name] = false
                }
            })
        }
    })( allowMultiple )



    function onSelectImage( item ) {

        if (allowMultiple) {
            CANDIDATES[ item.name ] = !CANDIDATES[ item.name ]
        } else {
            CANDIDATES = { [item.name]: true }
        }

        window.CANDIDATES = CANDIDATES

    }


    async function onRequestFile( item ) {
        if (item.static) {
            filesBin.srcs[item.name] = item
        } else {

            if ($incompatible) return warning.set(true)

            let opts = { mode: 'read' }
            let permission = await item.queryPermission(opts)
            console.log(`[Files] 🔐  ${item.name} permission: ${permission}`)

            try {
                if (permission  != 'granted') permission = await item.requestPermission(opts)
                const file = await item.getFile()
                filesBin.srcs[item.name] = {
                    name: item.name,
                    url: URL.createObjectURL(file)
                }
            } catch(err) {
                console.log(`[Files] 🚨  ${item.name} needs permission: ${permission}`)
            }
        }
    }

    async function onRequestAll() {


        for( const item of filesBin.items) onRequestFile( item )
    }

    async function onAccessFiles(e) {

        if ($incompatible) return warning.set(true)

        let neu = await window.showOpenFilePicker({
            types: [
                {
                    description: 'Images',
                    accept: { 'image/*': ['.png', '.gif', '.jpeg', '.jpg'] }
                }
            ],
            excludeAcceptAllOption: true,
            multiple: true
        })

        filesBin.items = filesBin.items.concat(neu)
        await db.set.files( filesBin.items.filter( h => !h.static ) )
        await onRequestAll()
    }

    async function removeHandle( item ) {
        if (!window.confirm(`Remove ${item.name} from bin?`)) return
        let cp = filesBin.items
        filesBin.items = []
        const idx = cp.indexOf(item)
        if (idx != -1) cp.splice( idx, 1 )
        filesBin.items = cp
        await set( FILES_KEY, filesBin.items.filter( h => !h.static ) )
    }
    async function onClearAllHandles( item ) {


        if (!window.confirm(`Remove all filesBin from bin?`)) return
        filesBin.items = filesBin.items.filter( h => h.static )
        await set( FILES_KEY, [] )
    }


    let classes = {
        miniButtons: `p0 rel w3em h3em bg pointer z-index4 bt0-solid br0-solid`,
        lanes: `flex column br1-solid overflow-auto no-basis grow`
    }


    let lastLib = 9999
    $: (lib => {
        if ($library && lastLib != $library) {
            console.log(`[Files] ✨  setting candidates from project`)
            CANDIDATES = {}
            lastLib = $library
            let count = 0
            for (const file of filesBin.items) {
                let found = project.fileNames.find( name => name == file.name )
                if ( found ) {
                    CANDIDATES[ file.name ] = true
                    count += 1
                }
            }

            if (count > 1) allowMultiple = true
        }
    })($library)


    function saveToProject() {
        let fn = Object.keys( CANDIDATES ).filter( f => (CANDIDATES[f]) )
        console.log(`[Files] 🐝  saving to project`, fn)
        library.set(false)
        $trigger.redraw = true
        project.fileNames = fn
    }




    let lastFiles
    let thumbs

    $: (async (filesBin_) => {
        let str = JSON.stringify( filesBin.srcs )
        if (str != lastFiles) {
            lastFiles = str

            if (!$inited.thumbs) $inited.thumbs = {}
            thumbs = (await db.get.thumbs()) || {}
            Object.keys( thumbs ).forEach( k => ($inited.thumbs[k] = true ))

            let toSave = 0

            for (const item of filesBin.items) {
                if (!thumbs[item.name]) {

                    try {
                        $inited.thumbs[item.name] = false
                        let thumb = rectd.neu( 0, 0, 320, 320 )
                        let png = await utils.createThumbnail( filesBin.srcs[item.name].url, thumb )
                        if (png.error) throw (png.error)
                        thumbs[item.name] = png
                        console.log(`[Files] 🖼  created new thumbnail for ${item.name}: ${thumbs[item.name].length} bytes`, filesBin)
                        setTimeout( e => ($inited.thumbs[item.name] = true), 1)
                        toSave += 1
                    } catch(err) {
                        console.log(`[Files] ❌  can't create thumb for ${item.name}`, filesBin)
                    }
                }

            }

            if (toSave > 0) {
                console.log(`[Files] ✅  saved ${toSave} new thumbs to localStorage`, thumbs)
                db.set.thumbs( thumbs )
            }
        }
    })( filesBin )

    async function onRemove( item ) {
        if (item.static) return
        filesBin.items = filesBin.items.filter( f => (item.name != f.name))
        filesBin.srcs[item.name] = null
    }

    function isSelected( item ) {
        return CANDIDATES.indexOf(item.name)!=-1
    }


</script>


<!-- FILES -->


<section class="flex column checker h100vh w100vw z-index99">
    <!-- <Title>Files</Title> -->
    <div class="flex row-space-between-center p1 pop bb1-solid">
        <div class="flex row-flex-end-center cmr1">

            <button on:click={e => library.set(false)}>
                <span class="icon">arrow_back</span>
                Cancel
            </button>
            <button 
                disabled={totalCandidates <= 0}
                on:click={saveToProject}>
                <span class="icon">done</span>
                Save to Project
            </button>
            <div>
                { filesBin.items.length } image{ filesBin.items.length > 0 ? 's' : ''},
                { totalCandidates } selected
            </div>
        </div>
        <div class="flex row-flex-start-center cml1">
            <button 
                on:click={onAccessFiles}>
                <span class="icon">add</span>
                Add Local Files
            </button>
            <button 
                on:click={onRequestAll}>
                <span class="icon">sync</span>
                Sync Local Files
            </button>
            <button 
                on:click={onClearAllHandles}>
                <span class="icon">clear</span>
                Clear All
            </button>
        </div>
    </div>
    <div class="flex grow overflow-auto">
        <div class="flex row-stretch-flex-start wrap">
            {#each filesBin.items as item, idx}
                <div 
                    class="b1-solid flex column basis0em grow minw16em m1 rel">






                    <!-- BODY -->

                    <div class="flex pointer column" on:click={e => onSelectImage( item )}>
                        {#if $inited.thumbs[item.name] }
                                <img 
                                    style={`opacity:${CANDIDATES[item.name] ? '1;' : '0.8;filter: grayscale(100%);'}`}
                                    class="" 
                                    src={thumbs[item.name]} 
                                    alt={item.name} />
                        {:else}
                            <div 
                                class="cross minh12em flex row-center-center">
                                {item.name}
                            </div>
                        {/if}

                    </div>


                    <!-- footer -->



                    <footer 
                        class="bt1-solid pop flex row-space-between-center rel z-index99 pl1 pr0-5 ptb0-6 ">
                        <span 
                            class="fill" />
                        <div class="flex row-flex-start-center">
                            <!-- <div 
                                class="move grabbable">
                                <span class="icon">drag_indicator</span>
                            </div> -->
                            <div>
                                {item.name}
                            </div>
                        </div>
                        <div class="flex row-flex-start-center z-index2  z-index2">

                            <div 
                                class:disabled={ item.static }
                                class="flex h2em w2em row-center-center pointer radius2em"
                                on:click={ e => onRequestFile( item ) }>
                                <span class="icon t0 l0">sync</span>
                            </div>
                            <div 
                                class:disabled={ item.static }
                                class="flex h2em w2em row-center-center pointer radius2em"
                                on:click={ e => onRemove( item ) }>
                                <!-- <span class="cross w10px h10px flex block" />   -->
                                <span class="icon t0 l0">clear</span>  
                            </div>


                        </div>
                    </footer>


                </div>
            {/each}
            {#each (new Array(10)) as idx, i}
                <div class="flex column basis0em grow minw16em mlr1 rel" />
            {/each}
        </div>
    </div>
        
    {#if filesBin.items.length == 0 }
        <div class="p1">No filesBin</div>
    {/if}
</section>
