
var App = React.createClass({
    componentWillMount: function() {
        this.setupAjax();
        this.createLock();
        this.setState({idToken: this.getIdToken()})
    },
    /* We will create the lock widget and pass it to sub-components */
    createLock: function() {
        this.lock = new Auth0Lock('c9uKFfivjqDH2i0dNA3hFC7Cs5GDImgb', 'basefolder.auth0.com');
    },
    /* We will ensure that any AJAX request to our Go API has the authorization
     header and passes the user JWT with the request */
    setupAjax: function() {
        $.ajaxSetup({
            'beforeSend': function(xhr) {
                if (localStorage.getItem('userToken')) {
                    xhr.setRequestHeader('Authorization',
                        'Bearer ' + localStorage.getItem('userToken'));
                }
            }
        });
    },
    /* The getIdToken function get us the users JWT if already authenticated
     or if it's the first time logging in, will get the JWT data and store it in local storage */
    getIdToken: function() {
        var idToken = localStorage.getItem('userToken');
        var authHash = this.lock.parseHash(window.location.hash);
        if (!idToken && authHash) {
            if (authHash.id_token) {
                idToken = authHash.id_token
                localStorage.setItem('userToken', authHash.id_token);
            }
            if (authHash.error) {
                console.log("Error signing in", authHash);
            }
        }
        return idToken;
    },
    render: function() {
        if (this.state.idToken) {
            /* If the user is logged in, we'll pass the lock widget and the token to the LoggedIn Component */
            return (<LoggedIn lock={this.lock} idToken={this.state.idToken} />);
        } else {
            return (<Home lock={this.lock} />);
        }
    }
});

var Home = React.createClass({
    /* We will get the lock instance created in the App component
     and bind it to a showLock function */
    showLock: function() {
        this.props.lock.show();
    },
    render: function() {
        return (
            <div className="container">
                <div className="col-xs-12 jumbotron text-center">
                    <h1>We R VR</h1>
                    <p>Provide valuable feedback to VR experience developers.</p>
                    // When the user clicks on the button titled Sign In we will display the lock widget
                    <a onClick={this.showLock} className="btn btn-primary btn-lg btn-login btn-block">Sign In</a>
                </div>
            </div>);
    }
});

var LoggedIn = React.createClass({
    /* We will create a logout function that will log the user out */
    logout : function(){
        localStorage.removeItem('userToken');
        this.props.lock.logout({returnTo:'http://localhost:3000'})
    },
    getInitialState: function() {
        return {
            profile: null,
            products: null
        }
    },
    componentDidMount: function() {
        /* Once the component is created, we will get the user information from Auth0 */
        this.props.lock.getProfile(this.props.idToken, function (err, profile) {
            if (err) {
                console.log("Error loading the Profile", err);
                alert("Error loading the Profile");
            }
            this.setState({profile: profile});
        }.bind(this));

        /* Additionally, we will make a call to our Go API and get a list of products the user can review */
        this.serverRequest = $.get('http://localhost:3000/products', function (result) {
            this.setState({
                products: result,
            });
        }.bind(this));
    },

    render: function() {
        if (this.state.profile) {
            return (
                <div className="col-lg-12">
                    <span className="pull-right">{this.state.profile.nickname} <a onClick={this.logout}>Log out</a></span>
                    <h2>Welcome to We R VR</h2>
                    <p>Below you'll find the latest games that need feedback. Please provide honest feedback so developers can make the best games.</p>
                    <div className="row">
                        {this.state.products.map(function(product, i){
                            return <Product key={i} product={product} />
                        })}
                    </div>
                </div>);
        } else {
            return (<div>Loading...</div>);
        }
    }
});

var Product = React.createClass({
    /* We will add the functionality for our upvote and downvote functions
     Both of this will send a POST request to our Golang API */
    upvote : function(){
        var product = this.props.product;
        this.serverRequest = $.post('http://localhost:3000/products/' + product.Slug + '/feedback', {vote : 1}, function (result) {
            this.setState({voted: "Upvoted"})
        }.bind(this));
    },
    downvote: function(){
        var product = this.props.product;
        this.serverRequest = $.post('http://localhost:3000/products/' + product.Slug + '/feedback', {vote : -1}, function (result) {
            this.setState({voted: "Downvoted"})
        }.bind(this));
    },
    getInitialState: function() {
        return {
            voted: null
        }
    },
    render : function(){
        return(
            <div className="col-xs-4">
                <div className="panel panel-default">
                    <div className="panel-heading">{this.props.product.Name} <span className="pull-right">{this.state.voted}</span></div>
                    <div className="panel-body">
                        {this.props.product.Description}
                    </div>
                    <div className="panel-footer">
                        <a onClick={this.upvote} className="btn btn-default">
                            <span className="glyphicon glyphicon-thumbs-up"></span>
                        </a>
                        <a onClick={this.downvote} className="btn btn-default pull-right">
                            <span className="glyphicon glyphicon-thumbs-down"></span>
                        </a>
                    </div>
                </div>
            </div>);
    }
})

ReactDOM.render(<App />, document.getElementById('app'));
