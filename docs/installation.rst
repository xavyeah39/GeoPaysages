============
INSTALLATION
============
.. image:: ./logo.png

-----

Prérequis
=========

Application développée et installée sur un serveur Debian 9 (stretch) ou Debian 10 (buster).

Ce serveur doit aussi disposer de : 

- sudo (apt-get install sudo)
- un utilisateur (``monuser`` dans cette documentation) appartenant au groupe ``sudo`` (pour pouvoir bénéficier des droits d'administrateur)

:notes:

    Si sudo n'est pas installé par défaut, voir https://www.privateinternetaccess.com/forum/discussion/18063/debian-8-1-0-jessie-sudo-fix-not-installed-by-default
    

Installation de l'environnement logiciel
========================================

**1. Récupérer la dernière version  de GeoPaysages sur le dépôt (https://github.com/PnX-SI/GeoPaysages/releases)**
	
Ces opérations doivent être faites avec l'utilisateur courant (autre que ``root``), ``monuser`` dans l'exemple :

::

    cd /home/<monuser>
    wget https://github.com/PnX-SI/GeoPaysages/archive/X.Y.Z.zip

    
:notes:

    Si la commande ``wget`` renvoie une erreur liée au certificat, installer le paquet ``ca-certificates`` (``sudo apt-get install ca-certificates``) puis relancer la commande ``wget`` ci-dessus.

Dézipper l'archive :
	
::

    unzip X.Y.Z.zip
	
Vous pouvez renommer le dossier qui contient l'application (dans un dossier ``/home/<monuser>/geopaysages/`` par exemple) :
	
::

    mv GeoPaysages-X.Y.Z geopaysages



**2. Se placer dans le dossier qui contient l'application et lancer l'installation de l'environnement serveur :**

Le script ``install_env.sh`` va automatiquement installer les outils nécessaires à l'application s'ils ne sont pas déjà sur le serveur : 

- PostgreSQL 9.6+
- PostGIS 
- Nginx
- Python 3

:notes:

    ATTENTION : les versions de PostgreSQL et PostGIS qui seront installées dépendent de la version de Debian utilisée. Exemples : 
    Pour Debian 9 : posgresql-9.6-postgis-2.3
    Pour Debian 10 : posgresql-11-postgis-2.5

    Si vous souhaitez spécifier le couple de versions que vous souhaitez utiliser, procéder comme suit :

    - créer un fichier de source pour le dépôt officiel de PostgreSQL :

    ``sudo nano /etc/apt/sources.list.d/pgdg.list``

    - Y ajoutez la ligne suivante :

    ``deb http://apt.postgresql.org/pub/repos/apt/ buster-pgdg main``

    - Importer la clef de signature du dépôt :

    ``wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -``

    - Mettre à jour la liste des paquets :

    ``sudo apt-get update``

    - Enfin, modifier la ligne concernée dans le fichier ``install_env.sh`` en précisant le couple de versions de PostgreSQL - PostGIS souhaité (indispensable désormais). Exemple :

    ``sudo apt-get install postgresql postgresql-11-postgis-2.5 postgresql-contrib postgresql-common postgresql-11-postgis-2.5-scripts``


Le script suivant installera les logiciels nécessaires au fonctionnement de l'application :

::

    cd /home/<monuser>/geopaysages
    ./install_env.sh



Installation de la base de données
==================================


**1. Configuration de la BDD  :** 

:notes:

    Selon votre contexte, veillez à configurer comme il se doit les fichiers de configurations de PostgeSQL ``postgresql.conf`` et ``pg_hba.conf``.


Modifier le fichier de configuration de la BDD et de son installation automatique ``install_configuration/settings.ini``. 


:notes:

    Suivez bien les indications en commentaire dans ce fichier

:notes:

    Attention à ne pas mettre de 'quote' dans les valeurs, même pour les chaines de caractères.
    
:notes:

    Le script d'installation automatique de la BDD ne fonctionne que pour une installation de celle-ci en localhost car la création d'une BDD recquiert des droits non disponibles depuis un autre serveur. Dans le cas d'une BDD distante, adapter les commandes du fichier ``install_db.sh`` en les exécutant une par une.


**2. Gestion des utilisateurs avec UsersHub :**

La gestion des utilisateurs pour la connexion à l'interface d'administration de GeoPaysages (back-office) est hérité de l'application UsersHub (https://github.com/PnX-SI/UsersHub) et de son module d'authentification (https://github.com/PnX-SI/UsersHub-authentification-module).

Centralisé en BDD dans le schéma ``utilisateurs``, il est possible d'installer celui-ci :

- de manière locale et indépendante --> Nécessitera de gérer les roles et les relations directement en SQL.

- en connectant la BDD de données distante (Foreign Data Wrapper) d'une application UsersHub déjà pré-installée par ailleurs (pour une gestion centralisée des utilisateurs via l'interface de UsersHub). Voir la documentation d'installation de UsersHub le cas échéant.

:notes:

    Suivez bien les indications en commentaire dans la rubrique "GESTION DES UTILISATEURS" du fichier ``settings.ini``.


**3. Lancer le fichier fichier d'installation de la base de données :**

::

    ./install_db.sh


:notes:

    Vous pouvez consulter le log de cette installation de la base dans ``var/log/install_db.log`` et vérifier qu'aucune erreur n'est intervenue.
    
    Le script ``install_db.sh`` supprime la BDD de GeoPaysages et la recrée entièrement. 


Installation de l'application
============================

**1. Configuration de l'application :**


Editer le fichier de configuration ``./backend/config.py.tpl``.

- Vérifier que la variable ``SQLALCHEMY_DATABASE_URI`` contient les bonnes informations de connexion à la BDD
- Ne pas modifier les path des fichiers static
- Renseigner les autres paramètres selon votre contexte


**2. Lancer l'installation automatique de l'application :**
	
::

    ./install_app.sh


Personnalisation de l'application
=================================
	
Vous pouvez personnaliser l'application en modifiant et ajoutant des fichiers dans le répertoire ``backend/static/custom/`` (css, logo).

L'éventuelle surcouche CSS est à réaliser dans le fichier ``custom/css/custom-style.css``.

Certains paramètres sont gérés depuis la table ``geopaysages.conf`` de la base de données :

- ``external_links``, les liens en bas à droite dans le footer, est un tableau d'objets devant contenir un label et une URL, ex.
::

        [{
            "label": "Site du Parc national de Vanoise",
            "url": "http://www.vanoise-parcnational.fr"
        }, {
            "label": "Rando Vanoise",
            "url": "http://rando.vanoise.com"
        }]

- ``zoom_map_comparator``, la valeur du zoom à l'initialisation de la carte de page comparateur de photos

- ``zoom_max_fitbounds_map``, la valeur du zoom max lorsqu'on filtre les points sur la carte des sites d'observations. Ce paramètre évite que le zoom soit trop important lorsque les points restant sont très rapprochés.

- ``map_layers``, les différentes couches disponibles sur les cartes, voir ce lien pour connaitre toutes les options de configuration https://leafletjs.com/reference-1.5.0.html#tilelayer, ex :
::

        [
          {
            "label": "OSM classic",
            "url": "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            "options": {
              "maxZoom": 18,
              "attribution": "&copy; <a href=\"http://www.openstreetmap.org/copyright\">OpenStreetMap</a>"
            }
          },
          {
            "label": "IGN",
            "url": "http://wxs.ign.fr/[clé ign]/geoportail/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.MAPS&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image%2Fjpeg",
            "options": {
              "maxZoom": 18,
              "attribution": "&copy; <div>IgnMap</div>"
            }
          }
        ]


- ``map_custom_marker`` permet de personnaliser le marqueur de localisation des sites (en surcouchant celui par défaut hérité de la librairie Leaflet) dans les différentes cartes de l'application.  Si le paramètre à une valeur ``NULL`` ou si il est absent de la table ``geopaysages.conf``, le marqueur Leaflet par défaut s'affichera. Lors d'une nouvelle installation, le paramètre sera tout de même crée et renseigné comme suit à titre d'exemple :
::

    {
      "iconUrl": "static/custom/images/custom_marker.png",
      "shadowUrl": "static/custom/images/custom_marker_shadow.png",  
      "iconSize": [40, 40],
      "shadowSize": [46, 20],
      "iconAnchor": [20, 40],
      "shadowAnchor": [12, 18], 
      "popupAnchor": [0, -20]
    }

/!\ Une mauvaise syntaxe ou de mauvaises valeurs impacteront le bon fonctionnement des cartes. 

Pour en savoir plus sur les options disponibles de la méthode ``L.icon`` et son utilisation, reportez-vous à la documentation Leaflet : https://leafletjs.com/reference-1.7.1.html#icon 
et aux tutoriels disponibles : https://leafletjs.com/examples/custom-icons/


Si vous utiliser la version 2 du comparateur photos (paramètre ``COMPARATOR_VERSION = 2`` dans ``config.py.tpl``), vous pouvez personnaliser celui-ci selon votre contexte. Notamment le simplifier dans le cas de série de photos sur des pas temps plutôt espacés (reconductions pluri-annuelles, annuelles voire mensuelles) :

- ``comparator_date_filter``, permet d'activer ``True`` ou de désactiver ``False`` l'outil de filtrage par plage de dates (actif par défaut si le paramètre n'est pas renseigné). Celui-ci étant peu utile dans le cas de petites séries de photos ou de reconductions annuelles par exemple.

- ``comparator_date_step_button``, permet de masquer le bouton sélecteur de pas de temps. Si il est renseigné à ``False`` le bouton ne sera pas affiché et les boutons précédent/suivant fonctionneront sans distinction de pas de temps. Utile dans le cas de petite séries de photos.

- ``comparator_date_format``, permet de personnaliser le format d'affichage des dates des photos dans le bouton sélecteur. Avec la valeur ``year`` on affiche la date au format ``YYYY``. Avec ``month`` --> ``MM/YYYY``.
Le comportement par défaut reste l'affichage de la date complète au format ``day`` --> ``DD/MM/YYYY`` (si non-renseigné).
Ce paramètre permet aussi de filtrer en conséquence les pas de temps disponibles dans le bouton ad-hoc (exemple : si ``month`` est défini, les pas de temps disponibles seront ``1 mois`` et ``1 an``). Utile dans le cas où les dates de photos sont parfois imprécises (photos ancienns, cartes postales...).


Activation du bloc d'intro en page d'accueil
============================================

- Ajouter 1 ligne dans la table conf tel que ``key`` : ``home_intro`` et assigner à ``value`` le texte à afficher
- En cas de contenue multilingue préférer ``key`` : ``home_intro_<lang>`` ex. ``home_intro_fr``
- Ajouter 1 ligne dans la table conf tel que ``key`` : ``home_intro_position`` et ``value``: ``top`` ou ``bottom``, toute autre valeur désactive le bloc


Activation de la page de présentation (/about)
==============================================

- Ajouter 2 lignes dans la table conf tel que ``key`` : ``page_about_title`` et ``key`` : ``page_about_content``
- Activer le lien et la page en ajoutant une ligne dans la table ``conf`` tel que ``key`` : ``page_about_published`` et ``value`` : ``true``, toute autre valeur vaut ``false``
- En cas de contenue multilingue ajouter le suffixe ``_<lang>`` à ``page_about_title``, ``page_about_content`` et ``page_about_published``


Ajout et personnalisation d'une nouvelle page HTML
==================================================

Il est aussi possible d'ajouter d'autres pages HTML, mais celles-ci seront écrasées à chaque mise à jour.

**1. Création de la page HTML**

- La page d'exemple pour créer une nouvelle page html dans le site se trouve dans ``backend/tpl/sample.html``
- Copier/coller ``sample.html`` et renommer la nouvelle page

**2. Créer la route vers la nouvelle page**

- Ouvrir le fichier ``backend/routes.py``
- Copier/coller un bloc existant et effectuer les modifications nécessaires en lien avec la nouvelle page HTML

**3. Ajout du lien vers la nouvelle page HTML**

- Ouvrir le fichier ``backend/tpl/layout.html``
- Copier/coller un bloc ``li`` existant et effectuer les modifications nécessaires en lien avec la nouvelle page HTML

**4. Création de l'intitulé du lien via l'internationalisation**

- Ouvrir le fichier ``backend/i18n/fr/LC_MESSAGES/messages.po``
- Copier/coller un bloc existant et effectuer les modifications nécessaires en lien avec la nouvelle page HTML

**5. Compilation pour la prise en compte des modifications**

- Suivre les étapes du chapitre Internatinalisation de l'application
- Pour les modifications effectuées dans les fichiers python, relancer la compilation python

::

        sudo service supervisor restart


Internationalisation de l'application
======================================   

- Pour modifier les textes, éditer le fichier ``backend/i18n/fr/messages.po``
- Activer l'environnement virtuel (depuis le répertoire source par exemple (geopaysages))

::

    cd geopaysages/
    . venv/bin/activate

- Lancer la commande de compilation en se plaçant au préalable dans le répertoire backend :

::

    cd backend/
    pybabel compile -d i18n

:notes:

  Pour plus d'informations, voir https://pythonhosted.org/Flask-Babel/
  
  Pour sortir de l'environnement virtuel, taper ``deactivate``

 
Installation du back-office
============================

**1. Configuration de l'application :**

Editer le fichier de configuration ``./front-backOffice/src/app/config.ts.tpl``.

:notes:

    Pour utiliser l'utilisateur ``admin`` intégré par défaut, il faut renseigner ``id_application : 1`` --> Lorsque l'installation du schéma ``utilisateurs`` de la BDD à été défini avec le paramètre ``local`` dans ``settings.ini``.

    Pour utiliser les utilisateurs d'une BDD UsersHub configurée lors de l'installation du schéma ``utilisateurs`` avec le paramètre ``foreign`` dans ``settings.ini`` : reporter l'id_application de GeoPaysages que vous avez préalablement crée dans UsersHub.
    
    Pour ``apiUrl`` et ``staticPicturesUrl``, bien mettre http://xxx.xxx.xxx.xxx, si utilisation d'une adresse IP.
    

**2. Lancer l'installation automatique de l'application :**
	
::

    ./install_backoffice.sh


Configuration de Nginx
======================

**1. Configuration de supervisor :**
	
::

   sudo nano /etc/supervisor/conf.d/geopaysages.conf

Copiez/collez-y ces lignes en renseignant les bons chemins et le bon port : 

::

    [program:geopaysages]
    directory=/home/<monuser>/geopaysages/backend
    command=/home/<monuser>/geopaysages/venv/bin/gunicorn app:app -b localhost:8000
    autostart=true
    autorestart=true
    user=<monuser>

    stderr_logfile=/var/log/geopaysages/geopaysages.err.log
    stdout_logfile=/var/log/geopaysages/geopaysages.out.log


**2. Configuration de Nginx :**

::

    sudo nano /etc/nginx/conf.d/geopaysages.conf

Copiez/collez-y ces lignes en renseignant les bons chemins et le bon port : 

::

    server {
        listen       80;
        server_name  localhost;
        client_max_body_size 100M;
        location / {
            proxy_pass http://127.0.0.1:8000;
        }

        location /pictures {
            alias  /home/<monuser>/data/images/;
        }

        location /app_admin {
            alias /home/<monuser>/app_admin;
            try_files $uri$args $uri$args/ /app_admin/index.html;
        }
    }


:notes:	

    La limite de la taille des fichiers en upload est configurée à 100 Mo (client_max_body_size)
    Modifier server_name pour ajouter le nom domaine associé à GeoPaysages :
	 
::

    server_name mondomaine.fr

**3. Redémarrer supervisor et Nginx :**
 
::  

    sudo supervisord -c /etc/supervisor/supervisord.conf
    sudo supervisorctl reread
    sudo service supervisor restart
    sudo service nginx restart


**4. Connectez-vous au back-office :**

- Allez sur l'URL : <mon_url>/app_admin
- Connectez-vous avec l'identifiant ``admin`` et le mot de passe ``admin``
- Ajoutez/modifiez vos données
    

Développement
=============

- Créer et activer un environnement virtuel python 3.
- cd ./backend
- Exécuter pip install -r ./requirements.txt
- Dupliquer et renommer ./config.py.tpl vers ./config.py
- Editer la config
- Lancer l'app FLASK_APP=./app.py FLASK_DEBUG=1 flask run
