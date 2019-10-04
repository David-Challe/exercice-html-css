/**
 * Created by sstienface on 07/10/2018.
 *
 * @author Simon Stien <contact@isolud.com>
 * @version 1.0
 *
 *
 */


(function() {

    /*
     * Service http, en oie les requetes et ajax et recoit les données du serveur
     */
    var HttpService = function (params) {
        var url = params.url,
            method = params.method,
            data = params.data,
            sucessCallback = params.sucessCallback,
            errorCallback = params.errorCallback;

        var xhttp = new XMLHttpRequest();

        // onreadystate change est un événement, nous écoutons cet événement qui éxécute une fonction anonyme pendant l'envoie
        // de la reqûete ajax
        xhttp.onreadystatechange = function () {

            // La requete ajax renvoie deux propriétés : readyState et status
            // readyState a différentes valeurs pendant l'envoie de la requete, 4 signifie que la requête est complétée
            // status est le code http renvoyé, 200 signifie que tout s'est bien passé
            if (this.readyState == 4) {

                // responseTexte est une propriété renvoyée par la requête ajax, c'est le contenu retourné par la requête
                try {
                    var response = JSON.parse(this.responseText);
                }
                catch (e) {
                    console.log(e);
                    if (typeof(errorCallback) == "function") {
                        errorCallback(response);

                    }
                }

                if (this.status == 200 || this.status == 201) {

                    if (typeof(sucessCallback) == "function") {
                        sucessCallback(response);
                    }
                }
                else {
                    if (typeof(errorCallback) == "function") {
                        errorCallback(response);
                    }
                }
            }
        };

        /* La commande open permet de spécifier le protocole utilisé ( GET ou POST ) , l'adresse du script ou du fichier à
         executer, le troisieme parametre détermine si l requête va être envoyée de maniére asynchrone ou synchrone, vous devriez
         toujours laisser ce parametre sur "true" car si la requête est synchrone, tant que la requête ne sera pas terminée,
         le programme javascript sera mis en "pause" */
        xhttp.open(method, url, true);

        // la commande send permet d'envoyer la requete
        xhttp.send(JSON.stringify(data));
    };

    var Kenny = {

        domElement: document.getElementById("kenny"),
        minY: 0,
        maxY: 460,
        _x: 50,
        _y: 200,
        y: 200,
        _width: 32,
        _height: 32,
        hasCollided: false,

        getPosition: function () {
            return this.y;
        },

        updatePosition: function (t) {
            //Cette méthode va nous permettre de mettre à jour la position top de Kenny
            document.getElementById("kenny").style.top = t + "px";

            // On défini également le y de Kenny manuellement, cela nous évitera un appel au dom couteux en ressource
            this.y = t;

        }

    };

    var Bomb = function () {

        this.generateY = function () {
            this.y = Math.random() * Kenny.maxY;
        };

        this.generateX = function () {
            this.x = 550 + (Math.random() * 100);
        }

        this._originalX = 550;
        this.x = 550;

        //Used for collision detection
        this._width = 40;
        this._height = 45;

        //
        this.generateY();
        this.active = true;
        this.domElement = document.createElement("div");

        this.domElement.className = "bomb";
        this.domElement.style.cssText = "left:" + this.x + "px; top:" + this.y + "px;";


        //Drop the bomb on creation
        document.getElementById("viewport").appendChild(this.domElement);


        this.refresh = function () {
            if (this.x < -90) {
                this.generateX();
                this.generateY();
                this.domElement.style.top = this.y + "px";
            }
            this.domElement.style.left = this.x + "px";

        };

        this.checkCollision = function () {
            // Ici nous allons détecter les collisions à partir d'une certaine position => raison : performance
            // On souhaite également détecter la collision uniquement si un bombe a son left supérieur à 0
            if (this.x < (Kenny._x + this._width) + Kenny._width && this.x > 0) {
                // Formule detection collision
                /*
                 if (this.x < (Kenny._x + Kenny._width) &&
                 (this.x + this._width) > Kenny._x &&
                 this.y < Kenny.y + Kenny._height &&
                 (this._height + this.y) > Kenny.y) {
                 // collision détectée !
                 alert('collision');
                 }*/

                if (this.x < (Kenny._x + (Kenny._width / 2))
                    && this.y > (Kenny.y - (this._height) )
                    && this.y < (Kenny.y + 5 )
                    && this.x > (Kenny._x - (Kenny._width / 2) )
                ) {

                    // collision détectée !
                    if (!Kenny.hasCollided) {
                        KennyGame.gameOver(this);
                        //Ce boolean nous permet de ne pas déclencher une collision deux fois
                        Kenny.hasCollided = true;
                    }
                }

            }
        };

        this.remove = function () {
            document.getElementById("viewport").removeChild(this.domElement);
        }


    };

    var KennyGame = {

        Bombs: [],
        BombsAmount: {min: 2, max: 30},
        timeElapsed: 0,
        timeToAddBomb: 30000,
        bombsPerLevel: 2,
        loopInterval: 25,
        timerObject: null,
        timerDomElement: document.getElementById("kenny-timer"),
        playerName: document.getElementById("player-name").value,
        recordScoreScreen: document.getElementById("kenny-setscore-screen"),
        leaderboardScreen: document.getElementById("kenny-leaderboard-screen"),
        kennyScoreSurvivedElement: document.getElementById("kenny-score-survived"),

        normalizedTime: null,

        init: function () {
            this.evListener();
            //this.bombsLoop();

        },
        restart: function () {
            //this.bombsLoop();
            document.getElementById("kenny-start-game").classList.toggle("toggle");
        },
        evListener: function () {
            document.body.addEventListener("keydown", function (e) {
                console.log(e);
                var t = Kenny.getPosition();
                var supportedKeyPress = false;
                if (e.key == "ArrowUp") {
                    t = t - 10;
                    supportedKeyPress = true;
                }
                if (e.key == "ArrowDown") {
                    t = t + 10;
                    supportedKeyPress = true;
                }


                if (supportedKeyPress) {
                    //Restriction de Kenny au viewport
                    if (t >= Kenny.minY && t <= Kenny.maxY) {

                        Kenny.updatePosition(t);

                    }
                }
            });


            // Event permettant d'envoyer le score du joueur
            document.getElementById("btn-score-send").addEventListener("click", function (e) {
                KennyGame.recordScoreScreen.classList.toggle("toggle");

                new HttpService({
                    url: "api/leaderboard/create.php",
                    method: "POST",
                    data: {name: document.getElementById("player-name").value, score_time: KennyGame.timeElapsed},
                    sucessCallback: function (response) {
                        //KennyGame.recordScoreScreen.classList.toggle('toggle');
                        KennyGame.replay();
                    },
                    errorCallback: function (response) {
                        alert("Une erreur est survenue lors de l'enregistrement du score");
                        //KennyGame.recordScoreScreen.classList.toggle('toggle');
                        KennyGame.replay();
                    }

                });
            });

            // Event permettant de rejouer
            document.getElementById("btn-replay").addEventListener("click", function (e) {
                KennyGame.recordScoreScreen.classList.toggle("toggle");
                KennyGame.replay();
            });

            //Event permettant d'écouter le clic sur le bouton classement
            document.getElementById("btn-leaderboard").addEventListener("click", function (e) {
                KennyGame.leaderboardScreen.classList.toggle("toggle");


                // Call vers leaderboard read ajax
                new HttpService({
                    url: "api/leaderboard/read.php",
                    method: "GET",
                    data: {},
                    sucessCallback: function (response) {
                        // Populate the data
                        var d = document.createDocumentFragment();
                        var ol = document.createElement("ol");
                        var i = 0;
                        var l = response.length;

                        if (l > 0) {
                            for (i; i < l; i++) {
                                if (response[i]) {
                                    var li = document.createElement("li");
                                    var span_name = document.createElement("span");
                                    var span_score = document.createElement("span");
                                    span_name.innerHTML = response[i].name;

                                    //var date = new Date(response[i].score_time*1000);

                                    span_score.innerHTML = KennyGame.normalizeTime(parseInt(response[i].score_time));

                                    li.appendChild(span_name);
                                    li.appendChild(span_score);
                                    ol.appendChild(li);
                                }
                            }
                            0
                        }
                        else {
                            // Pas de résultats, on retourne une seule ligne qui indique à l'utilisateur qu'il n'y a pas de score enregistrés pour le moment
                            var li = document.createElement("li");
                            var span_norecord = document.createElement("span");
                            span_norecord.innerHTML = "- Pas de meilleur temps -";
                            li.appendChild(span_norecord);
                            ol.appendChild(li);

                        }

                        // On insere les éléments dans le fragment et on retourne l'élément documentFragment
                        d.appendChild(ol);
                        KennyGame.leaderboardScreen.innerHTML = "";
                        KennyGame.leaderboardScreen.appendChild(d);
                    },
                    errorCallback: function (response) {
                        // Display error
                    }

                });

            });

            //Event permettant d'écouter les lettres entrées dans le champ invisible
            document.getElementById("player-name").addEventListener("keyup", function () {
                KennyGame.setPlayerName();
            }, false);

            //Event permettant d'écouter le clic sur le bouton de démarrage du jeu
            document.getElementById("btn-start-game").addEventListener("click", function () {
                document.getElementById("kenny-start-game").classList.toggle("toggle");
                KennyGame.bombsLoop();
            }, false);
        },

        setPlayerName: function () {
            var splitLetters = document.getElementById("player-name").value.split("");
            var playerNameStr = "";
            for (var i in splitLetters) {
                var rnd = (Math.random() - 0.5) * 20;
                playerNameStr += "<span style='transform:rotate(" + rnd + "deg)'>" + splitLetters[i] + "</span>";
            }
            document.getElementById("input-display-player-name").innerHTML = playerNameStr;
        },

        countActiveBombs: function () {
            return parseInt(this.Bombs.length);
        },
        calculateBombsPerLevel: function () {
            return this.BombsAmount.min + (Math.floor((this.timeElapsed / this.timeToAddBomb)) * this.bombsPerLevel);
        },
        bombsLoop: function () {
            this.timeElapsed += this.loopInterval;


            this.timerObject = window.setTimeout(function () {
                KennyGame.bombsLoop();
            }, this.loopInterval);
            if (this.countActiveBombs() < this.BombsAmount.max) {
                for (var i = this.countActiveBombs(); i < this.calculateBombsPerLevel(); i++) {
                    this.Bombs.push(new Bomb());
                }
            }

            //Deplacement bombes
            if (this.countActiveBombs() > 0) {
                this.Bombs.forEach(function (bomb) {
                    bomb.x -= 10;
                    bomb.refresh();
                    bomb.checkCollision();
                });
            }

            //Mise à jour du timer
            this.timerUpdate();
        },
        timerUpdate: function () {
            this.normalizedTime = this.normalizeTime(this.timeElapsed);
            this.timerDomElement.innerHTML = this.normalizedTime;
        },
        normalizeTime: function (tps) {
            return new Date(tps).toISOString().substr(11, 8)
        },
        gameOver: function (bomb) {
            window.clearTimeout(this.timerObject);

            //Animation sur la bombe qui touche kenny
            if (bomb) {
                bomb.domElement.classList.add("bomb-animation");
                bomb.domElement.addEventListener("animationend", function () {

                    //Le joueur a la possibilité de mémmoriser son score puis de rejouer.
                    KennyGame.recordScoreScreen.classList.toggle("toggle");

                    //Affichage du temps survécu par Kenny
                    var timeSurvivedStr = KennyGame.normalizedTime.split(":");
                    KennyGame.kennyScoreSurvivedElement.innerHTML = timeSurvivedStr[0] + " heures " + timeSurvivedStr[1] + " minutes et " + timeSurvivedStr[2] + " secondes";

                    //Affichage du nom du joueur
                    document.getElementById("player-name").focus();
                    KennyGame.setPlayerName();

                });
            }


        },
        replay: function () {


            // Permet de rejouer une partie
            this.Bombs.forEach(function (bomb) {
                bomb.remove();
            });

            this.Bombs = [];
            this.timeElapsed = 0;
            Kenny.hasCollided = false;
            this.restart();

        }

    };

    KennyGame.init();


})();