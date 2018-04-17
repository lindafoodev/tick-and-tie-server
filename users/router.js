'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');

const { Deck } = require('../v1/models');
const { User } = require('./models');
const { localStrategy, jwtStrategy } = require('../auth/strategies');

const router = express.Router();

const jsonParser = bodyParser.json();

passport.use(localStrategy);
passport.use(jwtStrategy);

const jwtAuth = passport.authenticate('jwt', { session: false });

// Post to register a new user
router.post('/', jsonParser, (req, res) => {
	console.log('Enter users/ POST ', req.body);
	const requiredFields = ['username', 'password'];
	const missingField = requiredFields.find(field => !(field in req.body));

	if (missingField) {
		return res.status(422).json({
			code: 422,
			reason: 'ValidationError',
			message: 'Missing field',
			location: missingField
		});
	}

	const stringFields = ['username', 'password'];
	const nonStringField = stringFields.find(
		field => field in req.body && typeof req.body[field] !== 'string'
	);

	if (nonStringField) {
		return res.status(422).json({
			code: 422,
			reason: 'ValidationError',
			message: 'Incorrect field type: expected string',
			location: nonStringField
		});
	}

	// If the username and password aren't trimmed we give an error.  Users might
	// expect that these will work without trimming (i.e. they want the password
	// "foobar ", including the space at the end).  We need to reject such values
	// explicitly so the users know what's happening, rather than silently
	// trimming them and expecting the user to understand.
	// We'll silently trim the other fields, because they aren't credentials used
	// to log in, so it's less of a problem.
	const explicityTrimmedFields = ['username', 'password'];
	const nonTrimmedField = explicityTrimmedFields.find(
		field => req.body[field].trim() !== req.body[field]
	);

	if (nonTrimmedField) {
		return res.status(422).json({
			code: 422,
			reason: 'ValidationError',
			message: 'Cannot start or end with whitespace',
			location: nonTrimmedField
		});
	}

	const sizedFields = {
		username: {
			min: 1
		},
		password: {
			min: 10,
			// bcrypt truncates after 72 characters, so let's not give the illusion
			// of security by storing extra (unused) info
			max: 72
		}
	};
	const tooSmallField = Object.keys(sizedFields).find(
		field =>
			'min' in sizedFields[field] &&
            req.body[field].trim().length < sizedFields[field].min
	);
	const tooLargeField = Object.keys(sizedFields).find(
		field =>
			'max' in sizedFields[field] &&
            req.body[field].trim().length > sizedFields[field].max
	);

	if (tooSmallField || tooLargeField) {
		return res.status(422).json({
			code: 422,
			reason: 'ValidationError',
			message: tooSmallField
				? `Must be at least ${sizedFields[tooSmallField]
					.min} characters long`
				: `Must be at most ${sizedFields[tooLargeField]
					.max} characters long`,
			location: tooSmallField || tooLargeField
		});
	}

	let {username, password} = req.body;
	// Username and password come in pre-trimmed, otherwise we throw an error
	// before this
	return User.find({username})
		.count()
		.then(count => {
			if (count > 0) {
				// There is an existing user with the same username
				return Promise.reject({
					code: 422,
					reason: 'ValidationError',
					message: 'Username already taken',
					location: 'username'
				});
			}
			// If there is no existing user, hash the password
			return User.hashPassword(password);
		})
		.then(hash => {
			const list = [];

			Deck
				.find()
				.then(cards => {
					for (let i = 0; i < cards.length; i++){
						list.push({
							sideA: cards[i].sideA,
							sideB: cards[i].sideB,
							nValue: 1, 
							nextCard: i+1 > cards.length - 1 ? null : i+1
						});
					}
					return list;
			})
			.then(list => {
				return User.create({
					username,
					password: hash,
					deck: list,
					currentCard: 0,
					correctCount: 0,
					incorrectCount: 0
				});
			})
		.then(user => {
			return res.status(201).json(user.serialize());
		})
		.catch(err => {
			console.log('error back from create user = ', err);
			// Forward validation errors on to the client, otherwise give a 500
			// error because something unexpected has happened
			if (err.reason === 'ValidationError') {
				return res.status(err.code).json(err);
			}
			res.status(500).json({code: 500, message: 'Internal server error'});
		});
	});
});

router.get('/:id', (req, res) => {
	//by id
	let id = req.params.id;
	User.findById(id)
		.then(user => {
			console.log(user);
			res.json(user.deck[user.currentCard]);
		})
		.catch(err => res.status(500).json({message: 'Internal server error'}));
});

router.get('/', (req, res) => {
	console.log('enter get all user endpoint');
	//all users
	return User.find({})
		.then(user => res.json(user))
		.catch(err => res.status(500).json({message: 'Internal server error'}));
});

router.put('/:id', jsonParser, (req, res) => {
	let id = req.params.id;
  User
    .findById(id)
    .then(result => {
			console.log('what is result', result);
      let currentCard = result.deck[result.currentCard];
      let currentIndex = result.currentCard;
      let n;
      if (req.body.correctCount) {
        n = result.deck[currentIndex].nValue * 2;
        result.deck[currentIndex].nValue = n;
        result.correctCount++;
      } else {
        n = 1;
        result.deck[currentIndex].nValue = n;
        result.incorrectCount++;
      }
      result.currentCard = currentCard.nextCard;
			console.log('what is result.currentCount', result.currentCard);
			console.log('what is what', currentCard.nextCard);
      for (let i=0; i<n; i++) {
				currentCard = result.deck[currentCard.nextCard];
				console.log('what is currentCardin loop', currentCard);
        if (currentCard.nextCard === null) {
          result.deck[currentIndex].nextCard = null;
          currentCard.nextCard = currentIndex;
          return result;
        }
      }
      result.deck[currentIndex].nextCard = currentCard.nextCard;
      currentCard.nextCard = currentIndex;  
      return result;
    })
    .then(result => {
			console.log('what is result now', result);
      User
        .findByIdAndUpdate(id, {currentCard: result.currentCard, deck: result.deck, correctCount: result.correctCount, incorrectCount: result.incorrectCount}, {new: true})
        .then(updated => {
          res.status(200).json(updated.deck[updated.currentCard]);
        })
        .catch(err => console.error(err));
    });
});

module.exports = {router};
