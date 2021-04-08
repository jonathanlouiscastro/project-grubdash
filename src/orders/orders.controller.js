const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function list(req, res, next) {
    return res.json({ data: orders })
};

function read(req, res) {
    res.json({ data: res.locals.order })
  }

  function isValidOrder(req, res, next) {
    const requiredFields = ["deliverTo", "mobileNumber", "dishes"];
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

function hasDishes(req, res, next) {
    const checkDishes = req.body.data.dishes; 
    if ( !checkDishes ||checkDishes.length === 0 || !Array.isArray(checkDishes)) {
      return next({
        status: 400,
        message: "Order must include at least one dish",
      });
    }
    next();
  }

function create (req, res, next) {
    const { data: { deliverTo, mobileNumber, status, dishes } } = req.body;

    const newOrder = {
        id: nextId(),
        deliverTo,
        mobileNumber,
        status,
        dishes,
    };

    orders.push(newOrder);
    res.status(201).json({ data: newOrder});
};

function isIdMatch(req, res, next) {
    const {orderId} = req.params;
    const { data: { id } = {} } = req.body;
    if(id){
        if(id !== orderId) {
            return next({
                status: 400,
                message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`,
            });
        }
    }
    return next();
}

function update(req, res, next) {
    const { id } = res.locals.order;
    const updatedOrder = Object.assign(res.locals.order, req.body.data, { id });
    res.json({ data: updatedOrder });
  }

function orderExists (req, res, next) {
    const { orderId } = req.params;
    const foundOrder = orders.find(order => order.id === orderId);
    if (foundOrder) {
        res.locals.order = foundOrder;
        next();
    }
    return next({
        status: 404,
        message: `Order id not found: ${orderId}`,
    })
}

function isPending(req, res, next) {
    const status = res.locals.order.status;
    if (status !== "pending") {
        return next({
            status: 400,
            message: "An order cannot be deleted unless it is pending",
        });
    }
    return next();
}

function checkStatus(req, res, next) {
    const status = req.body.data.status
    if (!status || status === "invalid") {
      return next({
        status: 400,
        message:
          "Order must have a status of pending, preparing, out-for-delivery, delivered",
      });
    }
    next();
}

function checkQuantity (req, res, next) {
    const dishesCheckQuantity = req.body.data.dishes; 
    let index = dishesCheckQuantity.findIndex((dish) => dish.quantity <= 0 || !dish.quantity || typeof dish.quantity !== "number");
    if (index > -1) {
        return next({
            status: 400,
            message: `Dish ${index} must have a quantity that is an integer greater than 0`,
        });
    }
    next();
}

function destroy(req, res, next) {
    const index = orders.findIndex((order) => order.id === res.locals.order);
    orders.splice(index, 1);
    res.sendStatus(204);
}

module.exports = {
    list,
    create: [isValidOrder, hasDishes, checkQuantity, create],
    read:[orderExists, read],
    update: [orderExists, isValidOrder, hasDishes, checkQuantity, checkStatus, isIdMatch, update],
    delete: [orderExists, isPending, destroy]
}