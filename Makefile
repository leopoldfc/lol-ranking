.PHONY: up down scrape logs

up:
	docker compose up -d

down:
	docker compose down

scrape:
	docker compose run --rm app npm run scrape

logs:
	docker compose logs -f app
