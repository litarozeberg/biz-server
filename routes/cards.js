const express = require("express");
const joi = require("joi");
const _ = require("lodash");
const auth = require("../middlewares/auth")
const { Card } = require("../models/Card");

const router = express.Router();

const cardSchema = joi.object({
    name: joi.string().required().min(2),
    address: joi.string().required().min(2),
    description: joi.string().required().min(2),
    phone: joi.string().required().regex(/^0[2-9]\d{7,8}$/),
    image: joi.string().required(),
})

const genCardNumber = async () => {
    while (true) {
        let randomNum = _.random(1000, 999999);
        let card = await Card.findOne({ cardNumber: randomNum })
        if (!card) return randomNum;
    }
}

router.post("/", auth, async (req, res) => {
    try {
        const { error } = cardSchema.validate(req.body);
        if (error) return res.status(400).send(error.message)

        let card = new Card(req.body);
        card.cardNumber = await genCardNumber();
        card.user_id = req.payload._id;

        await card.save();
        res.status(201).send(card);
    } catch (error) {
        res.status(400).send("error in post card");
    }
});

router.get("/my-cards", auth, async (req, res) => {
    try {
        const myCards = await Card.find({ user_id: req.payload._id })
        if (myCards.length == 0) return res.status(404).send("No card for the connected user")
        res.status(200).send(myCards)
    } catch (error) {
        res.status(400).send("error in getting the cards")
    }
})

router.get("/:id", auth, async (req, res) => {
    try {
        let card = await Card.findOne({ _id: req.params.id, user_id: req.payload._id })
        if (!card) return res.status(404).send("Card was not found- with id")
        res.status(200).send(card);
    } catch (error) {
        res.status(400).send("error in getting specific card")
    }
})

router.get("/", auth, async (req, res) => {
    try {
        let cards = await Card.find();
        res.status(200).send(cards);
    } catch (error) {
        res.status(400).send("error in getting all cards")
    }
})

router.put("/:id", auth, async (req, res) => {
    try {
        const { error } = cardSchema.validate(req.body);
        if (error) return res.status(400).send(error.message)
        let card = await Card.findOneAndUpdate({ _id: req.params.id, user_id: req.payload._id }, req.body, { new: true })
        if (!card) return res.status(404).send("Card was not found - put")
        res.status(200).send(card);
    } catch (error) {
        res.status(400).send("error in getting specific card")
    }
})

router.delete("/:id", auth, async (req, res) => {
    try {
        const card = await Card.findOneAndRemove({ _id: req.params.id })
        if (!card) return res.status(404).send("card was not found- delete")
        res.status(200).send("Card was deleted successfully")
    } catch (error) {
        res.status(400).send("error in deleting specific card")
    }
})

module.exports = router;