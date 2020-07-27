const express = require('express');
const router = express.Router();
const usersControllers = require('../controllers/usersControllers');
const logueadoMW = require('../middlewares/logeadoMW');
const {check,validationResult,body} = require('express-validator');
const { User } = require('../database/models');

router.get('/register', usersControllers.register);


router.post('/register',[
    check('email').isEmail().withMessage('El email debe ser un email valido'),
    check('password').isLength({min:8}).withMessage('La contraseña debe tener al menos 8 caracteres'),
    body('email').custom(function(value){

        return User.findOne({
            where:{
                email:value,
            }
        })
           .then(users => {

            if(users){
                return Promise.reject('Usuario registrado');
             }
           })
           
    })

],usersControllers.processRegister);


router.get('/login',usersControllers.login);
router.post('/login',usersControllers.processLogin);
router.post('/addToCart', logueadoMW,usersControllers.addToCart);
router.post('/deleteFromCart',usersControllers.deleteFromCart);
router.post('/purchase',usersControllers.purchase);
router.get('/history',usersControllers.history);
router.get('/cart',usersControllers.cart);
router.get('/check',usersControllers.check);
router.post('/logout',usersControllers.logout);

module.exports = router;