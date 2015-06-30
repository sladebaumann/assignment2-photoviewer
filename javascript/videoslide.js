/**
 * Created by Slade on 2/10/2015.
 */
/*jslint browser: true*/
/*global photoviewer, YoutubeVideo */
(function () {
    "use strict";

    //key handler needs to be attached to the document
    //mouse handler is attached to the tile

    window.photoviewer = {
        settings: {
            proxy: "http://server7.tezzt.nl:1332/api/proxy",
            youtubeID: "UiQMlr4FUjs",
            rows: 2,
            columns: 2,
            volume: 1,
            random: true,
            videoIsPaused: false,
            help: false
        },

        tiles: [],
        tArr: [],
        emptyTile: {},

        //return random function
        r: function (min, max) {
            return (Math.floor(
                (Math.random() * (max - min) + min)
            ));
        },

        parseURL: function () {
            var settingsCounter, locations, split;

            locations = location.search.split("?");
            locations = locations[1];
            if (locations !== undefined) {
                locations = locations.split("&");

                for (settingsCounter = 0; settingsCounter < locations.length; settingsCounter += 1) {
                    split = locations[settingsCounter].split("=");

                    if (split[0] === "ID") {
                        photoviewer.settings.youtubeID = split[1];
                    } else if (split[0] === "VOLUME") {
                        photoviewer.settings.volume = parseInt(split[1], 10);
                    } else if (split[0] === "ROWS") {
                        photoviewer.settings.rows = parseInt(split[1], 10);
                    } else if (split[0] === "COLUMNS") {
                        photoviewer.settings.columns = parseInt(split[1], 10);
                    } else if (split[0] === "RANDOM") {
                        photoviewer.settings.random = parseInt(split[1], 10);
                    } else if (split[0] === "HELP") {
                        photoviewer.settings.help = parseInt(split[1], 10);
                    }
                }

            }
        },

        createInfoNodes: function () {
            var h1Node, bodyNode, imgNode, pNode;

            bodyNode = document.querySelector("body");

            h1Node = document.createElement("h1");
            h1Node.textContent = "Instructions";
            bodyNode.appendChild(h1Node);

            pNode = document.createElement("p");
            pNode.textContent = "Click on the tile horizontal or vertical next to the white tile to move. The keyboard can also be used to move the empty tile.";
            bodyNode.appendChild(pNode);

            pNode = document.createElement("p");
            pNode.textContent = "Controls: Move the empty tile(arrow keys), play/pause(p), help(h), volume up/down (0,1).";
            bodyNode.appendChild(pNode);

            pNode = document.createElement("p");
            pNode.textContent = "URL parameters are available to change some settings (ID, URL, VOLUME, ROWS, COLS, RANDOM, HELP).";
            bodyNode.appendChild(pNode);


            // create image for void tile
            imgNode = document.createElement("img");
            imgNode.src = "./images/1x1.png";
            imgNode.alt = "";
            imgNode.id = "emptyImage";
            bodyNode.appendChild(imgNode);
        },

        createTiles: function () {

            var tileContainer, bodyNode, rowCounter, columnCounter, tileName, tileWidth, tileHeight, tileBox, videoDiv;

            tileWidth = (Math.floor(document.querySelector('#myVid').offsetWidth) / photoviewer.settings.columns);
            tileHeight = (Math.floor(document.querySelector('#myVid').offsetHeight) / photoviewer.settings.rows);

            bodyNode = document.querySelector("body");
            videoDiv = document.querySelector("#videoDiv");

            //create tileContainer
            tileContainer = document.createElement("div");
            tileContainer.className = ("tileContainer");
            tileContainer.style.width = Math.floor(document.querySelector('#myVid').offsetWidth + 100 + photoviewer.settings.columns) + "px";
            tileContainer.style.height = Math.floor(document.querySelector('#myVid').offsetHeight + 100 + photoviewer.settings.rows) + "px";

            bodyNode.appendChild(tileContainer);


            //create initial tiles
            for (rowCounter = 0; rowCounter < photoviewer.settings.rows; rowCounter += 1) {
                for (columnCounter = 0; columnCounter < photoviewer.settings.columns; columnCounter += 1) {

                    tileName = 'tile' + rowCounter + columnCounter;

                    tileBox = document.createElement("canvas");
                    tileBox.id = tileName;
                    tileBox.width = tileWidth;
                    tileBox.height = tileHeight;
                    tileBox.className = "tile";
                    tileBox.addEventListener("click", photoviewer.moveClickHandler, false);

                    tileContainer.appendChild(tileBox);
                }
            }

            photoviewer.pushTilesToArray();
            photoviewer.randomTilesToArray();
            photoviewer.getEmptyTilePosition();
            photoviewer.randomizeTiles();

            //hides videoNode without ruining updateTiles
            videoDiv.style.width = "1px";
            videoDiv.style.height = "1px";
            videoDiv.style.overflow = "hidden";
        },

        updateTiles: function () {
            //need to make sure html is loaded before running the js
            //var i, canvas, ctx, myVid, x, tileID;
            var rowCounter, columnCounter, tileHeight, tileWidth, tileCounter, tileName, tileNode, videoNode,
                context, tile, row, column;

            tileWidth = Math.floor(document.querySelector("#myVid").offsetWidth / photoviewer.settings.columns);
            tileHeight = Math.floor(document.querySelector('#myVid').offsetHeight / photoviewer.settings.rows);
            tileCounter = 0;

            for (rowCounter = 0; rowCounter < photoviewer.settings.rows; rowCounter = rowCounter + 1) {
                for (columnCounter = 0; columnCounter < photoviewer.settings.columns; columnCounter = columnCounter + 1) {
                    /*for (tileCounter = 0; tileCounter < photoviewer.settings.columns*photoviewer.settings.rows; tileCounter += 1){
                     this could be the loop that it needs. I'm not sure
                     }*/
                    tile = photoviewer.tiles[tileCounter];
                    row = tile.row;
                    column = tile.column;
                    //needs to be one for loop to go through the array
                    tileName = 'tile' + rowCounter + columnCounter;
                    videoNode = document.querySelector("#myVid");
                    tileNode = document.querySelector("#" + tileName);
                    context = tileNode.getContext("2d");

                    if (tile.display) {
                        context.drawImage(videoNode, column * tileWidth, row * tileHeight, tileWidth, tileHeight, 0, 0, tileWidth, tileHeight);
                        if (photoviewer.settings.help) {
                            photoviewer.showSequence(context, tile.sequence);
                        }
                    } else {
                        context.rect(0, 0, tileWidth, tileHeight);
                        context.fillStyle = "white";
                        context.fill();
                    }

                    tileCounter = tileCounter + 1;
                }
            }
            setTimeout(photoviewer.updateTiles, 33);
        },

        randomizeTiles: function () {
            var i, t, numberOfTiles;
            numberOfTiles = photoviewer.settings.rows * photoviewer.settings.columns;
            t = [];
            for (i = 0; i < numberOfTiles; i += 1) {
                //t[i] = photoviewer.tiles[photoviewer.tArr[i]];
                t.push(photoviewer.tiles[photoviewer.tArr[i]]);
            }
            photoviewer.tiles = t;
        },

        createVideoNode: function () {
            var bodyNode, videoNode, youtubeId, myVideo, videoDiv;

            //get body node
            bodyNode = document.querySelector("body");

            //create video node
            videoNode = document.createElement("video");
            videoNode.id = "myVid";
            videoNode.volume = photoviewer.settings.volume;
            videoDiv = document.createElement("div");
            videoDiv.id = "videoDiv";

            bodyNode.appendChild(videoDiv);

            videoDiv.appendChild(videoNode);

            youtubeId = photoviewer.settings.youtubeID;

            myVideo = function (video) {
                var webm = video.getSource("video/webm", "medium");
                videoNode.src = webm.url;
            };

            YoutubeVideo(youtubeId, photoviewer.settings.proxy, myVideo);

            videoNode.autoplay = true;
            videoNode.loop = true;
            videoNode.load();
            videoNode.addEventListener("loadeddata", photoviewer.run);
        },

        pushTilesToArray: function () {
            var tileCounter, rowCounter, columnCounter, tile, emptyTile;
            tileCounter = 0;
            for (rowCounter = 0; rowCounter < photoviewer.settings.rows; rowCounter = rowCounter + 1) {
                for (columnCounter = 0; columnCounter < photoviewer.settings.columns; columnCounter = columnCounter + 1) {
                    tile = {
                        name: "tile" + rowCounter + columnCounter,
                        display: true,
                        row: rowCounter,
                        column: columnCounter,
                        sequence: tileCounter
                    };

                    photoviewer.tiles.push(tile);

                    tileCounter = tileCounter + 1;
                }
            }

            if (photoviewer.settings.random) {
                emptyTile = photoviewer.r(0, photoviewer.tiles.length);
                photoviewer.emptyTile = photoviewer.tiles[emptyTile];
                photoviewer.tiles[emptyTile].display = false;
            } else {
                photoviewer.emptyTile = photoviewer.tiles[photoviewer.tiles.length - 1];
                photoviewer.tiles[photoviewer.tiles.length - 1].display = false;
            }
        },

        moveClickHandler: function (clickedTile) {
            var tileID, position, nextTile, prevTile, upTile, downTile, tileClicked, clickedColumn;

            //I need to get the current position of the clickedTile
            //Then I need to use that position to move the tile into the empty space
            //cuts the word "tile" off of the ID"
            tileID = clickedTile.srcElement.id;
            position = (parseInt(tileID[4], 10) * photoviewer.settings.rows) + parseInt(tileID[5], 10);
            clickedColumn = parseInt(tileID[5], 10);

            //figure out relationship between row/column and tile drawn
            nextTile = photoviewer.tiles[position + 1];
            prevTile = photoviewer.tiles[position - 1];
            upTile = photoviewer.tiles[position - photoviewer.settings.columns];
            downTile = photoviewer.tiles[position + photoviewer.settings.columns];
            tileClicked = photoviewer.tiles[position];

            //if clicked, move to void tile position
            //if not touching the void tile, do nothing
            //if positions are original positions, then the user wins
            //if on the same row, you can swap. same with column
            if (nextTile !== undefined && nextTile === photoviewer.emptyTile && clickedColumn < photoviewer.settings.rows - 1) {
                photoviewer.tiles = photoviewer.swapTiles(
                    photoviewer.tiles,
                    photoviewer.tiles.indexOf(nextTile),
                    photoviewer.tiles.indexOf(tileClicked)
                );
            } else if (prevTile !== undefined && prevTile === photoviewer.emptyTile && clickedColumn !== 0) {
                photoviewer.tiles = photoviewer.swapTiles(
                    photoviewer.tiles,
                    photoviewer.tiles.indexOf(prevTile),
                    photoviewer.tiles.indexOf(tileClicked)
                );
            } else if (upTile !== undefined && upTile === photoviewer.emptyTile) {
                photoviewer.tiles = photoviewer.swapTiles(
                    photoviewer.tiles,
                    photoviewer.tiles.indexOf(upTile),
                    photoviewer.tiles.indexOf(tileClicked)
                );
            } else if (downTile !== undefined && downTile === photoviewer.emptyTile) {
                photoviewer.tiles = photoviewer.swapTiles(
                    photoviewer.tiles,
                    photoviewer.tiles.indexOf(downTile),
                    photoviewer.tiles.indexOf(tileClicked)
                );
            }
            if (photoviewer.checkForWin()) {
                photoviewer.didWin();
            }
        },

        moveKeyHandler: function (key) {
            var position, nextTile, emptyTile, prevTile, upTile, downTile, videoNode;

            videoNode = document.querySelector("#myVid");


            if (key.keyCode === 37) {
                //left
                position = photoviewer.getEmptyTilePosition();
                emptyTile = photoviewer.tiles[position];
                prevTile = photoviewer.tiles[position - 1];
                if (prevTile !== undefined) {
                    photoviewer.tiles = photoviewer.swapTiles(
                        photoviewer.tiles,
                        photoviewer.tiles.indexOf(prevTile),
                        photoviewer.tiles.indexOf(emptyTile)
                    );
                }
                if (photoviewer.checkForWin()) {
                    photoviewer.didWin();
                }
            } else if (key.keyCode === 38) {
                //up
                position = photoviewer.getEmptyTilePosition();
                emptyTile = photoviewer.tiles[position];
                upTile = photoviewer.tiles[position - photoviewer.settings.columns];
                if (upTile !== undefined) {
                    photoviewer.tiles = photoviewer.swapTiles(
                        photoviewer.tiles,
                        photoviewer.tiles.indexOf(upTile),
                        photoviewer.tiles.indexOf(emptyTile)
                    );
                }
                if (photoviewer.checkForWin()) {
                    photoviewer.didWin();
                }
            } else if (key.keyCode === 39) {
                //right
                position = photoviewer.getEmptyTilePosition();
                emptyTile = photoviewer.tiles[position];
                nextTile = photoviewer.tiles[position + 1];
                if (nextTile !== undefined) {
                    photoviewer.tiles = photoviewer.swapTiles(
                        photoviewer.tiles,
                        photoviewer.tiles.indexOf(nextTile),
                        photoviewer.tiles.indexOf(emptyTile)
                    );
                }
                if (photoviewer.checkForWin()) {
                    photoviewer.didWin();
                }
            } else if (key.keyCode === 40) {
                //down
                position = photoviewer.getEmptyTilePosition();
                emptyTile = photoviewer.tiles[position];
                downTile = photoviewer.tiles[position + photoviewer.settings.columns];
                if (downTile !== undefined) {
                    photoviewer.tiles = photoviewer.swapTiles(
                        photoviewer.tiles,
                        photoviewer.tiles.indexOf(downTile),
                        photoviewer.tiles.indexOf(emptyTile)
                    );
                }
                if (photoviewer.checkForWin()) {
                    photoviewer.didWin();
                }
                //video controls
            } else if (key.keyCode === 49 && videoNode.volume < 1) {
                videoNode.volume += 0.1;
            } else if (key.keyCode === 48 && videoNode.volume > 0) {
                videoNode.volume -= 0.1;
            } else if (key.keyCode === 80 && !photoviewer.settings.videoIsPaused) {
                videoNode.pause();
                photoviewer.settings.videoIsPaused = true;
            } else if (key.keyCode === 80 && photoviewer.settings.videoIsPaused) {
                videoNode.play();
                photoviewer.settings.videoIsPaused = false;
                //help
            } else if (key.keyCode === 72 && !photoviewer.settings.help) {
                photoviewer.settings.help = true;
            } else if (key.keyCode === 72 && photoviewer.settings.help) {
                photoviewer.settings.help = false;
            }



        },

        swapTiles: function (a, x, y) {
            //move first input tile to second input tile place
            //need to change the sequence. Update tiles should redraw it for us
            a.splice(y, 1, a.splice(x, 1, a[y])[0]);
            return a;
        },

        contains: function (el, ar) {
            var i, contains = false;
            for (i = 0; i < ar.length; i = i + 1) {
                if (el === ar[i]) {
                    contains = true;
                }
            }
            return contains;
        },

        getEmptyTilePosition: function () {
            var tileCounter;
            for (tileCounter = 0; tileCounter < photoviewer.tiles.length; tileCounter += 1) {
                if (photoviewer.tiles[tileCounter].name === photoviewer.emptyTile.name) {
                    return photoviewer.tiles.indexOf(photoviewer.tiles[tileCounter]);
                }
            }
        },

        randomTilesToArray: function () {
            var numberOfTiles, r;
            numberOfTiles = photoviewer.settings.rows * photoviewer.settings.columns;
            while (photoviewer.tArr.length !== numberOfTiles) {
                r = photoviewer.r(0, numberOfTiles);
                //check if r is not in photoviewer.tArr
                if (!photoviewer.contains(r, photoviewer.tArr)) {
                    photoviewer.tArr.push(r);
                }
            }
        },

        checkForWin: function () {
            var i;
            for (i = 0; i < photoviewer.tiles.length; i += 1) {
                if (photoviewer.tiles[i].sequence !== i) {
                    return false;
                }
            }
            return true;
        },

        didWin: function () {
            var h1Node;

            h1Node = document.querySelector("h1");
            h1Node.textContent = "You Win!";

            photoviewer.tiles[photoviewer.emptyTile.sequence].display = true;


        },

        showSequence: function (tileBox, tile) {
            tileBox.fillStyle = "red";
            tileBox.font = "bold 16px Arial";
            tileBox.fillText(tile, 8, 20);
        },


        init: function () {

            photoviewer.createInfoNodes();
            photoviewer.parseURL();
            photoviewer.createVideoNode();
        },

        run: function () {
            photoviewer.createTiles();
            photoviewer.updateTiles();
            document.body.addEventListener("keyup", photoviewer.moveKeyHandler);
        }

    };
}());

window.addEventListener("load", photoviewer.init);