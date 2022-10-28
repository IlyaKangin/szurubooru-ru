Это предполагает, что у вас есть Docker (версия 17.05 или выше).
и Docker Compose (версия 1.6.0 или выше) уже установлены.

### Подготовка

1. Скачайте исходники:

    ```console
    git clone https://github.com/rr-/szurubooru.git szuru
    cd szuru
    ```
2. Настройте приложение:

    ```console
    cp server/config.yaml.dist server/config.yaml
    edit server/config.yaml
    ```

    Обратите особое внимание на эти поля:

    - secret
    - the `smtp` section.

    Вы можете опустить строки, если хотите использовать значения этого поля по умолчанию.

3. Настройте Docker Compose:

    ```console
    cp doc/example.env .env
    edit .env
    ```

    Измените значения переменных в файле `.env` по мере необходимости.
    Прочтите комментарии, которые помогут вам сориентироваться. Обратите внимание, что `.env` должен находиться в корневом
    каталоге этого репозитория.

4. Вытащите контейнеры:

    Это извлекает последние контейнеры из docker.io:
    ```console
    docker-compose pull
    ```

    Если вы изменили исходный код приложения и хотели бы вручную
    постройте его, вместо этого следуйте инструкциям в [**Building **](#Building), а
    затем прочитайте здесь, как только закончите.

5. Запустите!

    Для первого запуска рекомендуется запускать базу данных отдельно:
    ```console
    docker-compose up -d sql
    ```

    Чтобы запустить все контейнеры:
    ```console
    docker-compose up -d
    ```

    Для просмотра/мониторинга журналов приложений:
    ```console
    docker-compose logs -f
    # (CTRL+C для выхода)
    ```

### Сборка

1. Отредактируйте `docker-compose.yml`, чтобы указать Docker создавать, а не извлекать контейнеры:

    ```diff yaml
    ...
    server:
    - image: szurubooru/server:latest
    + build: server
    ...
    client:
    - image: szurubooru/client:latest
    + build: client
    ...
    ```

    Вы можете выбрать создание любого из них из исходного кода.

2. Постройте контейнеры:

    ```console
    docker-compose build
    ```

    Это будет попытка построить оба контейнера, но вы можете указать `клиент`
    или `сервер`, чтобы заставить его создавать только один.

    Если `docker-compose build` выплевывает:

    ```
    ERROR: Service 'server' failed to build: failed to parse platform : "" is an invalid component of "": platform specifier component must match "^[A-Za-z0-9_-]+$": invalid argument
    ```

    ...вам нужно будет экспортировать флаги Docker Build Kit:

    ```console
    export DOCKER_BUILDKIT=1; export COMPOSE_DOCKER_CLI_BUILD=1
    ```

    ...и запустите `docker-compose build` опять.

* Примечание: Если ваши изменения не вступают в силу в ваших сборках, рассмотрите возможность создания
с помощью `--no-cache`.*


### Дополнительные возможности

1. **Административные инструменты на уровне CLI**

    Вы можете использовать прилагаемый скрипт szuru-admin для выполнения различных
    административные задачи, такие как изменение или сброс пароля пользователя. Для
запуска из docker:

    ```console
    docker-compose run server ./szuru-admin --help
    ```

    даст вам разбивку по всем доступным командам.

2. **Использование отдельного домена для размещения статических файлов (содержимого изображений)**

    Если вы хотите разместить свой веб-сайт на, (`http://example.com /`), но хотите
обслуживать изображения в другом домене, (`http://static.example.com /`)
    затем вы можете запустить серверный контейнер с дополнительной средой
    переменная `DATA_URL=http://static.example.com/`. Убедитесь, что этот
дополнительный хост имеет доступ к содержимому тома "/data", смонтированного в
серверной части.

3. **Установка определенного базового URI для прокси-сервера**

    Некоторые пользователи могут пожелать получить доступ к сервису с другим базовым URI, например
    как `http://example.com/szuru /`, обычно при совместном использовании нескольких HTTP
    службы в одном домене с использованием обратного прокси-сервера. В этом случае просто установите
    `BASE_URL="/szuru/"` в вашем файле `.env`.

    Обратите внимание, что для этого потребуется обратный прокси-сервер. Вы должны установить
свой обратный прокси-сервер на прокси `http(ы)://example.com/szuru ` на
`http://<внутренний IP-адрес или имя хоста контейнера интерфейса>/`. Для NGINX
    обратный прокси-сервер, который будет отображаться как:

    ```nginx
    location /szuru {
        proxy_http_version 1.1;
        proxy_pass http://<internal IP or hostname of frontend container>/;

        proxy_set_header Host              $http_host;
        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        "upgrade";
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Scheme          $scheme;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Script-Name     /szuru;
    }
    ```

4. **Подготовка к производству**

    Если вы планируете использовать szurubooru в производственных условиях, вы можете выбрать
обратный прокси-сервер для дополнительной безопасности и возможностей кэширования. Начать
    заставив клиентский докер прослушивать только localhost, изменив `ПОРТ`
    в вашем файле `.env` на `127.0.0.1:8080` вместо просто `:8080`. Затем
настройте NGINX (или ваш кэширующий / обратный прокси-сервер по вашему выбору)
    к proxy_pass `http://127.0.0.1:8080 `. Пример конфигурации показан ниже:

    ```nginx
    # ideally, use ssl termination + cdn with a provider such as cloudflare.
    # modify as needed!

    # rate limiting zone
    # poor man's ddos protection, essentially
    limit_req_zone $binary_remote_addr zone=throttle:10m rate=25r/s;

    # www -> non-www
    server {
      listen 80;
      listen [::]:80;
      server_tokens off;
      server_name www.example.com
      return 301 http://example.com$request_uri;
    }

    server {
      server_name example.com;
      client_max_body_size 100M;
      client_body_timeout 30s;
      server_tokens off;
      location / {
        limit_req zone=throttle burst=5 delay=3;
        proxy_http_version 1.1;
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $http_host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Scheme $scheme;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Script-Name /szuru;
        error_page 500 501 502 504 505 506 507 508 509 510 511 @err;
        error_page 503 @throttle;
      }

      location @err {
        return 500 "server error. please try again later.";
        default_type text/plain;
      }
      location @throttle {
        return 503 "we've detected abuse on your ip. please wait and try again later.";
        default_type text/plain;
      }
      listen 80;
      listen [::]:80;
    }
    ```
