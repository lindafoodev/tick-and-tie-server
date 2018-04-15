'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const { Deck } = require('./models');
const { User } = require('../users/models');
const { localStrategy, jwtStrategy } = require('../auth/strategies');
const router = express.Router();
router.use(bodyParser.json());

passport.use(localStrategy);
passport.use(jwtStrategy);

const jwtAuth = passport.authenticate('jwt', { session: false });

//endpoint to check that the Deck database has data in it
//not used by the client
router.get('/all',  (req, res) => {
	return Deck.find({})
		.then(values => res.json(values))
		.catch(err => res.status(500).json({ message: 'Internal server error' }));
});

module.exports = { router };
