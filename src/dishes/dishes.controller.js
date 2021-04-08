const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function list(req, res, next) {
    return res.json({ data: dishes })
};

function read(req, res) {
    res.json({ data: res.locals.dish })
  }

function priceCheck(req, res, next) {
    const checkPrice = req.body.data.price;
    if (checkPrice <= 0 || !checkPrice || typeof checkPrice !== "number"){
        return next({
            status: 400,
            message: `price`,
        });
    }
    return next();
}
function isValidDish (req, res, next) {
    const requiredFields = ["name", "description", "price", "image_url"];
    for (const field of requiredFields) {
        if (!req.body.data[field]) {
            return next({
                status: 400,
                message: `"${field}" is required`,
            });
        }
    }
    return next();
};

function create (req, res, next) {
    const { data: { name, description, image_url, price } } = req.body;

    const newDish = {
        id: nextId(),
        name, 
        description,
        image_url,
        price,
    };

    dishes.push(newDish);
    res.status(201).json({ data: newDish });
};

function update(req, res, next) {
    const { dishId } = req.params;
    const foundDish = res.locals.dish;
    const { data: { id } = {} } = req.body;
 
    if (id) { 
        if(id !== dishId) {
            return next({
                status: 400,
                message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
            });
        }
    }
    const updatedDish = Object.assign(foundDish, req.body.data);
    res.json({ data: updatedDish });
  }

  function dishExists (req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find(dish => dish.id === dishId);
    if (foundDish === undefined) {
        return next({
            status: 404,
            message: `Dish id not found: ${dishId}`,
        })
    }
    res.locals.dish = foundDish;
    next();
  }

module.exports = {
    list,
    create: [isValidDish, priceCheck, create],
    read: [dishExists, read],
    update: [dishExists, isValidDish, priceCheck, update],
}