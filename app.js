//carregando os modulos
	const express = require('express');
	const handlebars = require('express-handlebars');
	const bodyParser = require('body-parser');
	const app = express();
	const admin = require('./routes/admin');
	const path = require('path');
	const mongoose = require('mongoose');
	const session = require('express-session')
	const flash = require('connect-flash')
	require("./models/postagem");
	const Postagem = mongoose.model("postagens");
	require('./models/Categoria');
	const Categoria = mongoose.model('categorias');
	const usuarios = require('./routes/usuario');
	const passport = require('passport');
	require("./config/auth")(passport);
	
	//config
	//sessão 
	app.use(session({
		secret: "cursodenode",
		resave: true,
		saveUninitialized: true
	}))

	app.use(passport.initialize());
	app.use(passport.session());

	app.use(flash())
	//middleware
		app.use((req, res, next) => {
			res.locals.success_msg = req.flash("success_msg");
			res.locals.error_msg = req.flash("error_msg");
			res.locals.error = req.flash("error")
			res.locals.user = req.user || null; 		
			next();
		})
		//variaveis que poderão ser utilizadas em qualquer local

	//body parser
		app.use(bodyParser.urlencoded({extended: true}));
		app.use(bodyParser.json());
		//serve para receber dados de qualquer formulário

	//handlebars
		app.engine('handlebars', handlebars({defaultLayout: 'main'}));
		app.set('view engine', 'handlebars');

	//Mongoose
		mongoose.Promise = global.Promise;
		mongoose.connect('mongodb://localhost/blogapp', {
			useNewUrlParser: true,
  			useUnifiedTopology: true
		}).then(() => {
			console.log("Conectado ao mongo");
		}).catch((err) => {
			console.log("Erro ao conectar-se ao banco");
		})

	//public
		app.use(express.static(path.join(__dirname, 'public')));
		//utilização do bootstrap

//rotas
	app.get('/', function(req, res){
		Postagem.find().populate('categoria').sort({data: 'desc'}).lean().then((postagens) => {
			res.render("index", {postagens: postagens});
		}).catch((err) => {
			req.flash("error_msg", "houve um erro");
			res.redirect("/404");
		})
	})

	app.get("/postagem/:slug", (req, res) => {
		Postagem.findOne({slug: req.params.slug}).lean().then((postagem) => {
			if(postagem) {
				res.render("postagem/index", {postagem: postagem})
			}	
			else {
				req.flash("error_msg", "Esta postagem não existe");
				res.redirect("/");
			}
		}).catch((err) => {
			req.flash("error_msg", "Houve um erro interno");
			res.redirect("/")
		})
	})

	app.get("/categorias", (req, res) => {
		Categoria.find().lean().then((categorias) => {
			res.render('categorias/index', {categorias: categorias});
		}).catch ((err) => {
			console.log(err);
			req.flash('error_msg', 'Houve um erro interno ao listar as categorias');
			res.redirect("/")
		})	
	})

	app.get("/categorias/:slug", (req, res) => 
	{
		
		Categoria.findOne({slug: req.params.slug}).lean().then((categoria) => 
		{

			if(categoria) {
				Postagem.find({categoria: categoria._id}).lean().then((postagens) => {
					res.render("categorias/postagens", {postagens: postagens, categoria: categoria})
				}).catch((err) => {
					req.flash("error_msg", "Houve um erro ao listas os posts");
					res.redirect("/")
				})
			}	
			else {
				req.flash("error_msg", "Esta categoria não existe");
				res.redirect("/")
			}

		}).catch((err) => 
		{
			req.flash("error_msg", "houve um erro interno ao carregar a pagina desta categoria");
			res.redirect("/")
		})
	})

	app.get("/404", (req, res) => {
		res.send("Erro 404!");
	})

	app.get('/posts', function(req, res){
		res.send("POSTS");
	})

	app.use('/admin', admin);
	app.use('/usuarios', usuarios);
  

//outros
const PORT = 8000;

app.listen(PORT, () => {
	console.log("Server rodando!")
})