# Makefile for Quran Juz Amma App

install:
	npm install

build:
	npm run compile

dev:
	npx vite

# Optionally, add a default target
all: install build
