# DailyTube Backend

🚀 **Live Demo:** [https://dailytube.vercel.app/](https://dailytube.vercel.app/)
🚀 **Its frontend:** [https://github.com/Puneet-TH/client](https://github.com/Puneet-TH/client)


A robust Node.js/Express backend for the DailyTube video-sharing platform. This API powers user authentication, video uploads, subscriptions, comments, likes, playlists, and more. Built for scalability, security, and seamless integration with the DailyTube frontend.

## Features
- **User Authentication:** JWT-based login, registration, and secure session management
- **Video Management:** Upload, stream, edit, and delete videos with Cloudinary integration
- **Subscriptions:** Subscribe/unsubscribe to channels, get subscriber counts
- **Playlists:** Create, update, and manage playlists
- **Comments & Likes:** Add, delete, and manage comments and likes on videos
- **Tweets:** Microblogging feature for users
- **Profile Management:** User profile, avatar, and cover image support
- **Dashboard:** Admin and user dashboards for analytics and management
- **API Response Standardization:** Consistent error and success responses
- **Rate Limiting & Security:** Middleware for rate limiting, CORS, and input validation

## Tech Stack
- **Node.js**
- **Express.js**
- **MongoDB** (Mongoose ODM)
- **Cloudinary** (media storage)
- **JWT** (authentication)
- **Multer** (file uploads)
- **dotenv** (environment variables)

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB instance (local or Atlas)
- Cloudinary account

### Installation
1. Clone the repository:
	```bash
	git clone <your-backend-repo-url>
	cd backend
	```
2. Install dependencies:
	```bash
	npm install
	```
3. Create a `.env` file in the root directory and add:
	```env
	MONGODB_URI=your_mongodb_uri
	CLOUDINARY_CLOUD_NAME=your_cloud_name
	CLOUDINARY_API_KEY=your_api_key
	CLOUDINARY_API_SECRET=your_api_secret
	JWT_SECRET=your_jwt_secret
	PORT=5000
	```
4. Start the server:
	```bash
	npm run dev
	```
## Folder Structure
```
backend/
  src/
	 controllers/
	 models/
	 routes/
	 middlewares/
	 utils/
	 db/
  public/
  package.json
  .env
  README.md
```

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](LICENSE)
#w