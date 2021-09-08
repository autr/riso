import utils from './_utils.js'

export default (e => { 
    let scraped = [
        {
            "name": "Metallic Silver",
            "japanese": "Drucken3000",
            "rgb": "153, 153, 152",
            "pantone": "4289 C"
        },
        {
            "name": "Metallic Copper",
            "japanese": "Drucken3000",
            "rgb": "161,100,91",
            "pantone": "N/A"
        },
        {
            "name": "Raspberry",
            "japanese": "Drucken3000",
            "rgb": "218,1,118",
            "pantone": "N/A"
        },
        {
            "name": "Fluorescent Lime",
            "japanese": "Drucken3000",
            "rgb": "204,255,0",
            "pantone": "N/A"
        },
        {
            "name": "Black Magic",
            "japanese": "Drucken3000",
            "rgb": "0, 0, 0",
            "pantone": "N/A"
        },
        {
            "name": "Black",
            "japanese": "ブラック",
            "rgb": "0, 0, 0",
            "pantone": "BLACK U"
        },
        {
            "name": "Burgundy",
            "japanese": "バーガンディーレッド",
            "rgb": "145, 78, 114",
            "pantone": "235 U"
        },
        {
            "name": "Blue",
            "japanese": "ブルー",
            "rgb": "0, 120, 191",
            "pantone": "3005 U"
        },
        {
            "name": "Green",
            "japanese": "グリーン",
            "rgb": "0, 169, 92",
            "pantone": "354 U"
        },
        {
            "name": "Medium Blue",
            "japanese": "ミディアムブルー",
            "rgb": "50, 85, 164",
            "pantone": "286 U"
        },
        {
            "name": "Bright Red",
            "japanese": "ブライトレッド",
            "rgb": "241, 80, 96",
            "pantone": "185 U"
        },
        {
            "name": "Risofederal Blue",
            "japanese": "リソー フェデラルブルー",
            "rgb": "61, 85, 136",
            "pantone": "288 U"
        },
        {
            "name": "Purple",
            "japanese": "パープル",
            "rgb": "118, 91, 167",
            "pantone": "2685 U"
        },
        {
            "name": "Teal",
            "japanese": "ティールグリーソ",
            "rgb": "0, 131, 138",
            "pantone": "321 U"
        },
        {
            "name": "Flat Gold",
            "japanese": "フラットゴールド",
            "rgb": "187, 139, 65",
            "pantone": "1245 U"
        },
        {
            "name": "Hunter Green",
            "japanese": "ハンターグリーン",
            "rgb": "64, 112, 96",
            "pantone": "342 U"
        },
        {
            "name": "Red",
            "japanese": "レッド",
            "rgb": "255, 102, 94",
            "pantone": "WARM RED U"
        },
        {
            "name": "Brown",
            "japanese": "ブラウン",
            "rgb": "146, 95, 82",
            "pantone": "7526 U"
        },
        {
            "name": "Yellow",
            "japanese": "イエロー",
            "rgb": "255, 232, 0",
            "pantone": "YELLOW U"
        },
        {
            "name": "Marine Red",
            "japanese": "リソーマリーンレッド",
            "rgb": "210, 81, 94",
            "pantone": "186 U"
        },
        {
            "name": "Orange",
            "japanese": "オレンジ",
            "rgb": "255, 108, 47",
            "pantone": "ORANGE 021 U"
        },
        {
            "name": "Fluorescent Pink",
            "japanese": "蛍光ピンク",
            "rgb": "255, 72, 176",
            "pantone": "806 U"
        },
        {
            "name": "Light Gray",
            "japanese": "ライトグレー",
            "rgb": "136, 137, 138",
            "pantone": "424 U"
        },
        {
            "name": "Flatallic Gold",
            "japanese": "フラッタリックゴールド",
            "rgb": "180, 143, 80",
            "pantone": ""
        },
        {
            "name": "Metallic Gold",
            "japanese": "金",
            "rgb": "172, 147, 110",
            "pantone": "872 U"
        },
        {
            "name": "Crimson",
            "japanese": "クリムゾン",
            "rgb": "228, 93, 80",
            "pantone": "485 U"
        },
        {
            "name": "Fluorescent Orange",
            "japanese": "蛍光オレンジ",
            "rgb": "255, 116, 119",
            "pantone": "805 U"
        },
        {
            "name": "Cornflower",
            "japanese": "コーンフラワー",
            "rgb": "98, 168, 229",
            "pantone": "292 U"
        },
        {
            "name": "Sky Blue",
            "japanese": "",
            "rgb": "73, 130, 207",
            "pantone": "285U"
        },
        {
            "name": "Sea Blue",
            "japanese": "",
            "rgb": "0, 116, 162",
            "pantone": "307 U"
        },
        {
            "name": "Lake",
            "japanese": "",
            "rgb": "35, 91, 168",
            "pantone": "293 U"
        },
        {
            "name": "Indigo",
            "japanese": "",
            "rgb": "72, 77, 122",
            "pantone": "2758 U"
        },
        {
            "name": "Midnight",
            "japanese": "",
            "rgb": "67, 80, 96",
            "pantone": "296 U"
        },
        {
            "name": "Mist",
            "japanese": "",
            "rgb": "184, 199, 196",
            "pantone": "5527 U"
        },
        {
            "name": "Granite",
            "japanese": "",
            "rgb": "165, 170, 168",
            "pantone": "7538 U"
        },
        {
            "name": "Charcoal",
            "japanese": "",
            "rgb": "112, 116, 124",
            "pantone": "7540 U"
        },
        {
            "name": "Smoky Teal",
            "japanese": "",
            "rgb": "95, 130, 137",
            "pantone": "5483 U"
        },
        {
            "name": "Steel",
            "japanese": "",
            "rgb": "55, 94, 119",
            "pantone": "302 U"
        },
        {
            "name": "Slate",
            "japanese": "",
            "rgb": "94, 105, 94",
            "pantone": "5605 U"
        },
        {
            "name": "Turquoise",
            "japanese": "",
            "rgb": "0, 170, 147",
            "pantone": "3275 U"
        },
        {
            "name": "Emerald",
            "japanese": "",
            "rgb": "25, 151, 93",
            "pantone": "355 U"
        },
        {
            "name": "Grass",
            "japanese": "",
            "rgb": "57, 126, 88",
            "pantone": "356 U"
        },
        {
            "name": "Forest",
            "japanese": "",
            "rgb": "81, 110, 90",
            "pantone": "357 U"
        },
        {
            "name": "Spruce",
            "japanese": "",
            "rgb": "74, 99, 93",
            "pantone": "567 U"
        },
        {
            "name": "Moss",
            "japanese": "",
            "rgb": "104, 114, 77",
            "pantone": "371 U"
        },
        {
            "name": "Sea Foam",
            "japanese": "",
            "rgb": "98, 194, 177",
            "pantone": "570 U"
        },
        {
            "name": "Kelly Green",
            "japanese": "ケリーグリーン",
            "rgb": "103, 179, 70",
            "pantone": "368 U"
        },
        {
            "name": "Light Teal",
            "japanese": "",
            "rgb": "0, 157, 165",
            "pantone": "320 U"
        },
        {
            "name": "Ivy",
            "japanese": "",
            "rgb": "22, 155, 98",
            "pantone": "347 U"
        },
        {
            "name": "Pine",
            "japanese": "",
            "rgb": "35, 126, 116",
            "pantone": "3295 U"
        },
        {
            "name": "Lagoon",
            "japanese": "",
            "rgb": "47, 97, 101",
            "pantone": "323 U"
        },
        {
            "name": "Violet",
            "japanese": "ヴァイオレット",
            "rgb": "157, 122, 210",
            "pantone": "265 U"
        },
        {
            "name": "Orchid",
            "japanese": "",
            "rgb": "187, 118, 207",
            "pantone": "2582 U"
        },
        {
            "name": "Plum",
            "japanese": "",
            "rgb": "132, 89, 145",
            "pantone": "2603 U"
        },
        {
            "name": "Raisin",
            "japanese": "",
            "rgb": "119, 93, 122",
            "pantone": "519 U"
        },
        {
            "name": "Grape",
            "japanese": "",
            "rgb": "108, 93, 128",
            "pantone": "2695 U"
        },
        {
            "name": "Scarlet",
            "japanese": "",
            "rgb": "246, 80, 88",
            "pantone": "RED 032 U"
        },
        {
            "name": "Tomato",
            "japanese": "",
            "rgb": "210, 81, 94",
            "pantone": "186 U"
        },
        {
            "name": "Cranberry",
            "japanese": "",
            "rgb": "194, 79, 93",
            "pantone": "200 U"
        },
        {
            "name": "Maroon",
            "japanese": "",
            "rgb": "158, 76, 110",
            "pantone": "221 U"
        },
        {
            "name": "Raspberry Red",
            "japanese": "",
            "rgb": "180, 75, 101",
            "pantone": "207 U"
        },
        {
            "name": "Brick",
            "japanese": "",
            "rgb": "167, 81, 84",
            "pantone": "1807 U"
        },
        {
            "name": "Light Lime",
            "japanese": "黄緑",
            "rgb": "227, 237, 85",
            "pantone": "387 U"
        },
        {
            "name": "Sunflower",
            "japanese": "",
            "rgb": "255, 181, 17",
            "pantone": "116 U"
        },
        {
            "name": "Melon",
            "japanese": "",
            "rgb": "255, 174, 59",
            "pantone": "1235 U"
        },
        {
            "name": "Apricot",
            "japanese": "",
            "rgb": "246, 160, 77",
            "pantone": "143 U"
        },
        {
            "name": "Paprika",
            "japanese": "",
            "rgb": "238, 127, 75",
            "pantone": "158 U"
        },
        {
            "name": "Pumpkin",
            "japanese": "",
            "rgb": "255, 111, 76",
            "pantone": "1655 U"
        },
        {
            "name": "Bright Olive Green",
            "japanese": "",
            "rgb": "180, 159, 41",
            "pantone": "103 U"
        },
        {
            "name": "Bright Gold",
            "japanese": "",
            "rgb": "186, 128, 50",
            "pantone": "131 U"
        },
        {
            "name": "Copper",
            "japanese": "",
            "rgb": "189, 100, 57",
            "pantone": "1525 U"
        },
        {
            "name": "Mahogany",
            "japanese": "",
            "rgb": "142, 89, 90",
            "pantone": "491 U"
        },
        {
            "name": "Bisque",
            "japanese": "",
            "rgb": "242, 205, 207",
            "pantone": "503 U"
        },
        {
            "name": "Bubble Gum",
            "japanese": "",
            "rgb": "249, 132, 202",
            "pantone": "231 U"
        },
        {
            "name": "Light Mauve",
            "japanese": "",
            "rgb": "230, 181, 201",
            "pantone": "7430 U"
        },
        {
            "name": "Dark Mauve",
            "japanese": "",
            "rgb": "189, 140, 166",
            "pantone": "687 U"
        },
        {
            "name": "Wine",
            "japanese": "",
            "rgb": "145, 78, 114",
            "pantone": "235 U"
        },
        {
            "name": "Gray",
            "japanese": "グレー",
            "rgb": "146, 141, 136",
            "pantone": "403 U"
        },
        {
            "name": "Coral",
            "japanese": "コーラル",
            "rgb": "255,142,145",
            "pantone": "177 U"
        },
        {
            "name": "White",
            "japanese": "白",
            "rgb": "255, 255, 255",
            "pantone": ""
        },
        {
            "name": "Aqua",
            "japanese": "アクア",
            "rgb": "94, 200, 229",
            "pantone": "637 U"
        },
        {
            "name": "Mint",
            "japanese": "ミント",
            "rgb": "130, 216, 213",
            "pantone": "324 U"
        },
        {
            "name": "Clear Medium",
            "japanese": "透明な培地",
            "rgb": "242,242,242",
            "pantone": ""
        },
        {
            "name": "Fluorescent Yellow",
            "japanese": "蛍光イエロー",
            "rgb": "255, 233, 22",
            "pantone": "803 U"
        },
        {
            "name": "Fluorescent Red",
            "japanese": "蛍光レッド",
            "rgb": "255, 76, 101",
            "pantone": "812 U"
        },
        {
            "name": "Fluorescent Green",
            "japanese": "蛍光グリーン",
            "rgb": "68, 214, 44",
            "pantone": "802 U"
        }
    ]


    return scraped.map( c => {
        c.values = c.rgb.split(',').map( l => {
            return parseFloat((parseFloat(l) / 255).toFixed(3))
        })
        c.type = 'normal'
        let n = c.name.toLowerCase()
        if ( n.indexOf('fluo') != -1) c.type = 'fluo'
        if ( n.indexOf('allic') != -1 || n.indexOf('gold') != -1 || n.indexOf('magic') != -1 ) c.type = 'metal'
        if ( n.indexOf('clear') != -1 ) c.type = 'clear'
        return c
    }).sort( (a,b) => {
        a = utils.rgbToHsl( a.values[0], a.values[1], a.values[2] )
        b = utils.rgbToHsl( b.values[0], b.values[1], b.values[2] )
        let thresh = 0.1
        if (a[1] < thresh ) {
            return (a[1] - b[1]) + (a[2] - b[2])
        }
        return a[0] - b[0]
    })


})