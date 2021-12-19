import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import listEndpoints from "express-list-endpoints";

import netflixData from "./data/netflix-titles.json";

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/project-mongo";
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = Promise;

const port = process.env.PORT || 8080;
const app = express();

// Add middlewares to enable cors and json body parsing
app.use(cors());
app.use(express.json());

// Our own middleware that checks if the database is connected before going to our endpoints
app.use((req, res, next) => {
	if (mongoose.connection.readyState === 1) {
		next();
	} else {
		res.status(503), json({ error: "Service unavailable" });
	}
});

const Show = mongoose.model("Show", {
	id: Number,
	title: String,
	director: String,
	cast: String,
	country: String,
	dateAdded: String,
	releaseYear: Number,
	rating: String,
	duration: String,
	listedIn: String,
	description: String,
	type: String,
});

if (process.env.RESET_DB) {
	const seedDatabase = /*async*/ () => {
		// await Show.deleteMany({});

		netflixData.forEach((item) => {
			const newShow = new Show(item);
			newShow.save();
		});
	};
	seedDatabase();
}

// listEndpoint will analyse what possible endpoints we have in our app.
app.get("/", (req, res) => {
	res.send(listEndpoints(app));
});

// Endpoint that gets all the shows
app.get("/shows", async (req, res) => {
	console.log(req.query);
	let shows = await Show.find(req.query);

	////////////// query that gets release year greater than
	if (req.query.releaseYear) {
		const showByYear = await Show.find().gt(
			"releaseYear",
			req.query.releaseYear
		);
		shows = showByYear;
	} // Add error-handeling here

	res.json(shows);
});

// Endpoint that gets one show based on id
app.get("/shows/id/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const showById = await Show.findById(id);

		if (showById) {
			res.json({
				response: showById,
				success: true,
			});
		} else {
			res.status(404).json({
				response: `No show found with id number ${id}`,
				success: false,
			});
		}
	} catch (err) {
		res.status(400).json({ error: "ID is invalid" });
	}
});

// Start the server
app.listen(port, () => {
	// eslint-disable-next-line
	console.log(`Server running on http://localhost:${port}`);
});
