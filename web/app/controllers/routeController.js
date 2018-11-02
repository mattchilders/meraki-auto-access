var apiRouter = require("../routes/apiRouter.js");

module.exports = function(app,passport,express){
    //POST Signup API call
    // Permissions [all]
    app.post('/api/signup', apiRouter);
    app.post('/api/signupoperator', operatorsRouter);

    // Webhooks
    app.post('/webhooks/*', webhooksRouter);

    //
    api.get('/api/*', apiRouter);

    //Any operator API call - authenticate against operator_id and use operator-router
    // Permissions [admin, operator_id = operatorid]
    app.all('/api/operators/:operatorid', passport.authenticate('jwt-operatorid', { session: false }), operatorsRouter);
    app.all('/api/operators/:operatorid/*', passport.authenticate('jwt-operatorid', { session: false }), operatorsRouter);
 
    //Any Customer API call - authenticate against customer_id and use customer-router
    // Permissions [admin, dashboard, customer_id = custid]
    app.all('/api/customers/:custid', passport.authenticate('jwt-customerid', { session: false }), customersRouter);
    app.all('/api/customers/:custid/*', passport.authenticate('jwt-customerid', { session: false }), customersRouter);

    //Any Partner API call - authenticate against customer_id and use sites-router
    // Permissions [admin, dashboard, site_id = siteid]
    app.all('/api/sites/:siteid', passport.authenticate('jwt-siteid', { session: false }), sitesRouter);
    app.all('/api/sites/:siteid/*', passport.authenticate('jwt-siteid', { session: false }), sitesRouter);
    //app.put('/api/sites/:siteid/*', passport.authenticate('jwt-siteid', { session: false }), sitesRouter);
    //app.post('/api/sites/:siteid/*', passport.authenticate('jwt-siteid', { session: false }), sitesRouter);

    //GET Endpoint API call - authenticate against endpoint and use endpoint-router
    // Permissions [admin, dashboard, endpoint]
    app.get('/api/adconfig/*', passport.authenticate('jwt-endpoint', { session: false }), endpointRouter);
    app.get('/api/config/*', passport.authenticate('jwt-endpoint', { session: false }), endpointRouter);
    app.get('/api/ads/file/*', passport.authenticate('jwt-endpoint', { session: false }), endpointRouter);
    app.post('/api/ep_audio_upload/*', passport.authenticate('jwt-endpoint', { session: false }), endpointRouter);

    //All API Get calls - authenticate against dashboard and use router
    // Permissions [admin, dashboard]
    app.get('/api/*', passport.authenticate('jwt-dashboard', { session: false,  failureRedirect: '/login?fromUrl=/api' }), apiRouter);

    //All API Post/Put/Delete calls - authenticate against admin and use router
    // Permissions [admin]
    app.post('/api/*', passport.authenticate('jwt-admin', { session: false,  failureRedirect: '/login?fromUrl=/api' }), apiRouter);
    app.put('/api/*', passport.authenticate('jwt-admin', { session: false,  failureRedirect: '/login?fromUrl=/api' }), apiRouter);
    app.delete('/api/*', passport.authenticate('jwt-admin', { session: false,  failureRedirect: '/login?fromUrl=/api' }), apiRouter);

    //Website Redirects
    app.use('/', express.static('public'));
    app.get('/recover', rh.recover);
    app.get('/customers', passport.authenticate('jwt-customer', { session: false, failureRedirect: '/login?fromUrl=/customers'}), rh.redirectCustomers);
    app.get('/partners', passport.authenticate('jwt-partner', { session: false, failureRedirect: '/login?fromUrl=/partners'}), rh.redirectPartners);
    app.get('/dashboard', passport.authenticate('jwt-dashboard', { session: false, failureRedirect: '/login?fromUrl=/dashboard'}), rh.redirectDashboard);
    app.get('/operators', passport.authenticate('jwt-operator', { session: false, failureRedirect: '/login?fromUrl=/operators'}), rh.redirectOperators);
    app.get('/user', passport.authenticate('jwt-partner', { session: false, failureRedirect: '/login?fromUrl=/partners'}), rh.return_user_info);
    app.use('/dashboard', passport.authenticate('jwt-dashboard', { session: false, failureRedirect: '/login?fromUrl=/dashboard' }), express.static('dashboard'));
    app.use('/operators', passport.authenticate('jwt-operator', { session: false, failureRedirect: '/login?fromUrl=/operators' }), express.static('operators'));
    //app.use('/admin', passport.authenticate('jwt-admin', { session: false, failureRedirect: '/login?fromUrl=/admin' }), express.static('admin'));
    app.get('/admin', passport.authenticate('jwt-admin', { session: false, failureRedirect: '/login?fromUrl=/admin' }), rh.redirectAdmin);
    app.use('/admin', passport.authenticate('jwt-admin', { session: false, failureRedirect: '/login?fromUrl=/admin' }), express.static('admin'));
    app.use('/customers', passport.authenticate('jwt-customer', { session: false, failureRedirect: '/login?fromUrl=/customers'}), express.static('customers'));
    app.use('/partners', passport.authenticate('jwt-partner', { session: false, failureRedirect: '/login?fromUrl=/partners'}), express.static('partners'));
    app.use('/ads', passport.authenticate('jwt', { session: false, failureRedirect: '/login?fromUrl=/ads' }),express.static('ads'));
    app.get('/logout', rh.logout);
    app.use('/test', express.static('test'));

    //Website Redirects
    // Index Auth Controller
    //app.get('/', authController.index);
    // Password recovery
    app.get('/recover', rh.recover);
    app.post('/recover', function(req, res, next){
                            req.flash('recoverMessage', 'A new random password has been sent to your email');
                            next();
                        }, rh.recoverpost);
    // Password change
    app.get('/passchange', passport.authenticate('jwt-customer', { session: false, failureRedirect: '/passchange'}), rh.passchange);
    app.post('/passchange', passport.authenticate('jwt-customer-passchange', {failureRedirect: '/passchange', failureFlash : true}), rh.passchange);
    app.get('/oppasschange', passport.authenticate('jwt-operator', { session: false, failureRedirect: '/oppasschange'}), rh.oppasschange);
    app.post('/oppasschange', passport.authenticate('jwt-operator-passchange', {failureRedirect: '/oppasschange', failureFlash : true}), rh.oppasschange);

    // Login
    app.get('/login', rh.setOrigUrl, rh.signin);
    app.post('/login', passport.authenticate('local-signin', {session: false, failureRedirect: '/login', failureFlash : true}), rh.createJWT, rh.fromUrl);
    
}
