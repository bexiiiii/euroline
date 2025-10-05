# News Management System

## Overview
This module provides a complete news management system for the admin panel with the ability to create, edit, and delete news articles. It includes image upload functionality and a public-facing news section.

## Features
- Admin panel for managing news articles
- Image upload for news cover images
- Public news listing page
- Individual news detail pages
- Draft vs. published status management

## Backend Implementation

### Database Schema
The news table includes the following fields:
- `id` - Primary key
- `title` - News title (required)
- `description` - Short description (optional)
- `cover_image_url` - URL to cover image (optional)
- `content` - Full news content (required)
- `is_published` - Publication status (default: false)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### API Endpoints
- `GET /api/news` - Get all news (admin only)
- `GET /api/news/published` - Get published news (public)
- `GET /api/news/{id}` - Get news by ID (public)
- `POST /api/news` - Create news (admin only)
- `PUT /api/news/{id}` - Update news (admin only)
- `DELETE /api/news/{id}` - Delete news (admin only)
- `POST /api/files/ads/upload` - Upload image files (admin only)

## Frontend Implementation

### Admin Panel
- News management section in sidebar
- News listing table with status indicators
- Create/Edit modal with form validation
- Image upload functionality
- Publish/Draft toggle

### Public Pages
- News listing page (`/news`)
- Individual news detail pages (`/news/{id}`)

## Usage

### Creating News
1. Navigate to the News section in the admin panel
2. Click "Создать новость"
3. Fill in the title, description, and content
4. Optionally upload a cover image
5. Toggle "Опубликовать" to make it visible to public
6. Click "Создать"

### Editing News
1. Find the news article in the listing
2. Click "Редактировать"
3. Make changes to any field
4. Click "Сохранить"

### Deleting News
1. Find the news article in the listing
2. Click "Удалить"
3. Confirm the deletion in the popup

## File Structure
```
backend/
├── modules/news/
│   ├── controller/NewsController.java
│   ├── dto/NewsDto.java
│   ├── dto/NewsRequest.java
│   ├── entity/News.java
│   ├── repository/NewsRepository.java
│   └── service/NewsService.java
└── resources/db/changelog/changes/17-create-news-table.sql

admin/
├── components/news/
│   ├── NewsManagement.tsx
│   ├── NewsModal.tsx
│   └── NewsTable.tsx
├── lib/api/news.ts
└── app/(admin)/(routes)/news/page.tsx

frontend/
├── components/NewsComponent.tsx
├── lib/api/news.ts
└── app/(routes)/news/
    ├── page.tsx
    └── [id]/page.tsx
```