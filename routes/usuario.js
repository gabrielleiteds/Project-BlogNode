const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
require('../models/Usuario');
const Usuario = mongoose.model('usuarios');
const bcrypt = require('bcryptjs')
const passport = require('passport')

router.get('/registro', (req, res) => {
    res.render('usuarios/registro')
})
//rota para o formulário de cadastro

router.post('/registro', (req, res) => {
    var erros = [];
    //validações
    if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null) {
        erros.push({texto: 'Nome invalido'});
    }
    if(!req.body.email || typeof req.body.email == undefined || req.body.email == null) {
        erros.push({texto: 'Email invalido'});
    }
    if(!req.body.senha || typeof req.body.senha == undefined || req.body.senha == null) {
        erros.push({texto: 'Senha invalido'});
    }
    if(req.body.senha.length < 4) {
        erros.push({texto: "senha muito curta"});
    }
    if(req.body.senha != req.body.senha2) {
        erros.push({texto: 'As senhas são diferentes'});
    }

    if(erros.length > 0) {
        res.render('usuarios/registro', {erros: erros})
    }
    else{
        Usuario.findOne({email: req.body.email}).then((usuario) => {
            if(usuario) {
                req.flash("error_msg", "Ja existe uma conta com este email");
                res.redirect("/usuarios/registro")
            }
            else {

                const novoUsuario = new Usuario({
                    nome: req.body.nome,
                    email: req.body.email,
                    senha: req.body.senha
                })
                //passagem de valores para um usuario

                bcrypt.genSalt(10, (erro, salt) => {
                    bcrypt.hash(novoUsuario.senha, salt, (erro, hash) => {
                        if(erro){
                            req.flash("error_msg", "Houve um erro no salvamento do usuario");
                            res.redirect("/")
                        }

                        novoUsuario.senha = hash;
                        //hash para a senha do usuário, segurança

                        //salvando usuario no banco de dados
                        novoUsuario.save().then(() => 
                        {
                            req.flash("success_msg", "Usuario criado com sucesso");
                            res.redirect('/');
                        }).catch((err) => {
                            req.flash("error_msg", "Houve um erro ao criar o usuario");
                            res.redirect("usuarios/registro")
                        })
                    });
                })
            }
        }).catch((err) => {
            console.log(err);
            req.flash("error_msg", "Houve um erro interno");
            res.redirect("/")
        })
    }

})

router.get('/login', (req, res) => {
    res.render("usuarios/login");
})

router.post('/login', passport.authenticate('local', { 
    successRedirect: '/',
    failureRedirect: '/usuarios/login',
    failureFlash: true })
);

router.get('/logout', (req, res) => {
    req.logout();
    req.flash("success_msg", "Deslogado com sucesso");
    res.redirect('/')
})


module.exports = router;