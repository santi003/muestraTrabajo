const bcryptjs=require('bcryptjs');
const { User , Product, Item ,sequelize, Cart } = require('../database/models');
const {check,validationResult,body} = require('express-validator');


const usersControllers = {
    register : function(req, res){
        
        return res.render('register');
    },
    processRegister:function(req,res){
        let errors=validationResult(req);

        if(errors.isEmpty()){

        let user=req.body;

        //creamos objeto que se guarda en base de datos
        delete user.retype;
        user.email=user.email,
        user.password=bcryptjs.hashSync(user.password,10);
        user.rol= 0;

        User.create(user)
           .then(user => res.redirect('/users/login'));

         }else{
             res.render('register',{errors:errors.errors});
         }

       
    },
    
     login:function(req,res){
         return res.render('login')
    },

    processLogin:function(req,res){

        User.findOne({
            where:{
                email: req.body.email,
            }
        })

        .then(user =>{


            if(user){
                if(bcryptjs.compareSync(req.body.password,user.dataValues.password)){
                    delete user.dataValues.password;
                    req.session.user=user;

                    if (req.body.recordame){
                        res.cookie('email', user.email, {maxAge:1000*60*60  *24}) //200min

                    }

                    return res.redirect('/');
                    
                     }else{
                         return res.redirect('/users/login');
                     }

                      }else{
                        return res.redirect('/users/login');
                      }  
        })
            
    },
    
    check:function(req,res){
        if(req.session.user==undefined){
            res.send("no estas logeado")
        }else{
            res.send("El usuario logueado es " + req.session.user.email);
        }
   },

        logout:function(req,res){

            req.session.destroy();

            if(req.cookies.email){

                res.clearCookie('email');
            }
            return res.redirect('/');
        },
        addToCart:function(req,res){

            Product.findByPk(req.body.productId)
                .then(product => {

                    let item = {
                        quantity: Number(req.body.quantity),
                        status: 1,
                        idUser: req.session.user.id,
                        idCart: null,
                        idProduct:product.id,
                        price:Number(product.price),
                        totalPrice:product.price*req.body.quantity

                    }

                    return Item.create(item)
                       .then(() =>{
                           return res.redirect('/users/cart')
                       })

                })


        },

        cart:function (req, res) {

            Item.findAll({
                where: {
                    idUser: req.session.user.id,
                    status:1,

                },
                include:['product']
            })
               .then(items => {

                let resultado = 0;
                for(i=0;i<items.length;i++){

                  resultado +=  Number(items[i].totalPrice)
                }
                return res.render('carrito',{items,resultado});
            })
        },

        deleteFromCart:function(req,res){
            Item.destroy({
                where:{
                    id:req.body.itemId
                },
                force:true
            })
              .then(()=>{
                  return res.redirect('/users/cart');
              })
        },

        purchase:function(req,res){
            let items;

            Item.findAll({
                where: {
                    idUser:req.session.user.id,
                    status: 1,
                }
            })
            .then(itemsEncontrados =>{
                items= itemsEncontrados;

                return sequelize.query(`UPDATE items SET status = 0 WHERE idUser = ${req.session.user.id} AND status = 1 `)


            })
            .then(()=>{
                return Cart.findOne({
                    order:[
                        ['createdAt','DESC']
                    ]
                })
            })
            .then(cart =>{

                let resultado = 0;
                for(i=0;i<items.length;i++){

                  resultado +=  (items[i].quantity*items[i].price) 
                }
                let newCart = {
                    cartNumber:cart ? cart.cartNumber + 1 : 100,
                    totalPrice:resultado,
                    idUser:req.session.user.id,

                }
                return Cart.create(newCart)
            })
            .then(cart=>{
                return sequelize.query(`UPDATE items SET idCart = ${cart.id} WHERE idUser = ${req.session.user.id} AND idCart IS NULL`)
            })
            .then(()=>{
                res.redirect('/users/history')
            })
        },

        history:function(req,res){

            Cart.findAll({
                where:{
                    idUser:req.session.user.id,
                },
                include:{
                    all:true,
                    nested:true
                }
            })
            .then(carts => {
                return res.render('history',{carts})
            })
        }
    

}

module.exports = usersControllers;