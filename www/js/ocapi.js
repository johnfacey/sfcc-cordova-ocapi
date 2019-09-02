function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
        vars[key] = value;
    });
    return vars;
}

var Util = {
    getCookie: function geCookie(cookies, cname) {
        var name = cname + "=";
        var ca = cookies.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1);
            if (c.indexOf(name) != -1) return c.substring(name.length, c.length);
        }
        return "";
    },
    loadPDP: function (thisObj) {
        var pid = $(thisObj).attr('pid');
        var myStorage = window.localStorage;
        myStorage.setItem('pid', pid);
        window.location = "shop-single.html";
    },
    loadCAT: function (thisObj) {
        var cat = $(thisObj).attr('cat');
        console.log("cat: " + cat);
        var myStorage = window.localStorage;
        myStorage.setItem('cat', cat);
        window.location = "product.html";
    },
    loadMap: function (map) {
        for (var propt in map) {
            jQuery("#" + propt).html(map[propt]);
        }
    },
    loadSettings: function () {
        var myStorage = window.localStorage;
        customer = JSON.parse(myStorage.getItem('customerData'));
        if (customer != undefined) {
            //console.log(customer.first_name +" " +  customer.last_name);
            jQuery("#customer_name").text(customer.first_name + " " + customer.last_name);
            jQuery("#email").text(customer.email);
        }
        return customer;
    },
    saveSettings: function () {
        var myStorage = window.localStorage;
        var customerData = JSON.stringify(customer);
        myStorage.setItem('customerData', customerData);
    }
};

var customer = {
    "email": "",
    "password": "",
    "first_name": "",
    "last_name": "",
    "basket_id": "",
    "customer_no": "",
    "Authorization": ""
};

var settings = {
    "username": "",
    "password": "",
    "proxy_url": "http://localhost:8080",
    "ocapi_url": "customers/auth",
    "pdp_url": "products/",
    "cat_root_url": "categories/root?levels=1",
    "cat_url_base": "product_search?refine_1=cgid=",
    "content_url": "content",
    "baskets_url": "customers",
    "basket_url": "baskets",
    "order_url": "orders"
};


function loginCustomer(isAuto) {

    if (isAuto) {
        var customer = Util.loadSettings();
        settings.username = customer.email;
        settings.password = customer.password;
    } else {
        var username = document.getElementById('username').value;
        var password = document.getElementById('password').value;
        settings.username = username;
        settings.password = password;
    }
    console.log('Start Login');
    OCAPI.auth(settings);
    OCAPI.createCart(settings);
    OCAPI.getBaskets(settings);
    OCAPI.getCart(settings);

}

function AddToBasket() {
    var myStorage = window.localStorage;
    pid = myStorage.getItem('pid');
    OCAPI.addProductToCart(settings, pid);
}

var OCAPI = {
    Authorization: "",
    auth: function (config) {
        var username = config.username;
        var password = config.password;
        $.ajax({
            type: "POST",
            beforeSend: function (xhr) {
				debugger;
                xhr.setRequestHeader("x-dw-client-id", config.client_id);
                xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + password));
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.setRequestHeader("callurl", config.ocapi_url);
                xhr.setRequestHeader("Access-Control-Allow-Credentials", true);
                xhr.setRequestHeader("Access-Control-Expose-Headers", "Authorization, ETag");
                console.log("Basic " + btoa(username + ":" + password));
                console.log(username + ":(password not shown)");
            },
            url: config.proxy_url + "&callback=?",
            dataType: 'json',
            method: 'POST',
            crossDomain: true,
            contentType: 'application/json',
            async: false,
            data: '{ "type" : "credentials" }',
            xhrFields: {
                withCredentials: true
            },
            success: function (data, textStatus, request) {

                customer_id = data.customer_id;
                customer_no = data.customer_no;
                customer = data;
                customer.password = config.password;
                Util.saveSettings(customer);
                if (jQuery("#login").length == 1) {
                    alert("Welcome " + customer.first_name + " " + customer.last_name);
                    window.location = "index.html";
                }

            },
            error: function (request) {

                alert(request.responseJSON.fault.type + ":" + request.responseJSON.fault.message);

            },
            complete: function (request) {


            }
        });
    },
    autoLogin: function (config) {
        var customer = Util.loadSettings();
        if (config != undefined && customer.email != undefined) {
            config.username = customer.email;
            config.password = customer.password;
        }

        //OCAPI.auth(config);                   //having an issue with this
    },
    getContent: function (config, content_id, selector) {
        //getFunction(arguments.callee.toString());

        $.ajax({
            type: "GET",
            beforeSend: function (xhr) {
                xhr.setRequestHeader("x-dw-client-id", config.client_id);
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.setRequestHeader("callurl", config.content_url + "/(" + content_id + ")");
                console.log(config.content_url + "/(" + content_id + ")");
            },
            url: config.proxy_url,
            dataType: 'json',
            method: 'GET',
            contentType: 'application/json',
            async: false,
            //data: '{ "type" : "credentials" }',
            success: function (data, textStatus, request) {

                if (data.count == 0) { /*error;*/
                    alert('Content Not Found');
                    console.log("Content Not Found: " + content_id);
                } else {

                    var asset = data.data[0];
                    jQuery("#" + selector).html(asset.c_body);
                    console.log("Content - " + selector + " - " + asset.c_body);

                }
            },
            error: function (request) {
                console.log(request);
                alert(request.responseJSON.fault.type + ":" + request.responseJSON.fault.message);

            }

        });

    },
    getProduct: function (config, product_id) {
        //getFunction(arguments.callee.toString());
        $.ajax({
            type: "POST",
            beforeSend: function (xhr) {
                xhr.setRequestHeader("x-dw-client-id", config.client_id);
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.setRequestHeader("callurl", config.pdp_url + "(" + product_id + ")?expand=images,promotions,prices");
                console.log(config.pdp_url + "(" + product_id + ")");
            },
            url: config.proxy_url,
            dataType: 'json',
            method: 'GET',
            contentType: 'application/json',
            async: false,
            //data: '{ "type" : "credentials" }',
            success: function (data, textStatus, request) {

                if (data.count == 0) { /*error;*/
                    console.log('Product Not Found');
                    alert('Product Not Found');
                } else {
                    product = data.data[0];
                    var thisImage = product.image_groups[0].images[0].dis_base_link;
                    $("#image").attr('src', thisImage);
                    $("#img_cart_" + product.id).attr('src', thisImage);
                    console.log("img_cart_" + product.id + " - " + $("#img_cart_" + product.id).length);
                    Util.loadMap(product);
                }
            },
            error: function (request) {
                console.log(request);
                alert(request.responseJSON.fault.type + ":" + request.responseJSON.fault.message);

            }

        });
    },
    getRootCategories: function (config) {
        $.ajax({
            type: "GET",
            beforeSend: function (xhr) {
                xhr.setRequestHeader("x-dw-client-id", config.client_id);
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.setRequestHeader("callurl", config.cat_root_url);
            },
            url: config.proxy_url,
            dataType: 'json',
            method: 'GET',
            contentType: 'application/json',
            async: false,
            //data: '{ "type" : "credentials" }',
            success: function (data, textStatus, request) {

                if (data.count == 0) { /*error;*/
                    console.log('Category Not Found');
                } else {
                    categories = data.categories;
                    console.log(categories.length);
                    for (i = 0; i < categories.length; i++) {
                        jQuery("#categories_root").append("<option value='" + categories[i].id + "'>" + categories[i].name + "</option>");
                    }
                    $("select").material_select();
                }
            },
            error: function (request) {
                console.log(request);
                alert(request.responseJSON.fault.type + ":" + request.responseJSON.fault.message);

            }

        });
    },
    getProductsfromCategory: function (config, category, count) {
        //getFunction(arguments.callee.toString());

        $.ajax({
            type: "GET",
            beforeSend: function (xhr) {
                xhr.setRequestHeader("x-dw-client-id", config.client_id);
                xhr.setRequestHeader("Content-Type", "application/json");

                if (count != "all") {
                    xhr.setRequestHeader("callurl", config.cat_url_base + category + "&expand=availability,prices,images&count=" + count);
                    console.log(config.cat_url_base + category + "&expand=availability,prices,images&count=" + count);
                } else {
                    xhr.setRequestHeader("callurl", config.cat_url_base + category + "&expand=availability,prices,images");
                    console.log(config.cat_url_base + category + "&expand=availability,prices,images");
                }

            },
            url: config.proxy_url,
            dataType: 'json',
            method: 'GET',
            contentType: 'application/json',
            async: false,
            success: function (data, textStatus, request) {
                var products = [];
                if (data.count == 0) { /*error;*/
                    console.log('Products Not Found');
                } else {

                    products = data.hits;
                    var template = '';
                    jQuery("#product_list").children().remove();

                    for (i = 0; i < products.length; i++) {
                        var thisProduct = products[i];

                        var thisImage = thisProduct.image.dis_base_link;
                        template += '<div class="col s6">';
                        template += ' <div class="content">';
                        template += '<a href="#" pid="' + thisProduct.product_id + '" onclick="Util.loadPDP(this)">';
                        template += '   <img src="' + thisImage + '" alt="">';
                        pid = thisProduct.product_id;
                        template += '   <h5>' + thisProduct.product_name + '</h5></a>';
                        //console.log('   <h5><a href="#" onclick="Util.loadPDP('+thisProduct.product_id+')">'+thisProduct.product_name+'</a></h5>');
                        template += '   <div class="star">';
                        template += '     <span class="active"><i class="fa fa-star"></i></span>';
                        template += '     <span class="active"><i class="fa fa-star"></i></span>';
                        template += '     <span class="active"><i class="fa fa-star"></i></span>';
                        template += '     <span class="active"><i class="fa fa-star"></i></span>';
                        template += '     <span class="active"><i class="fa fa-star"></i></span>';
                        template += '   </div>';
                        template += '    <h6 class="price">$' + thisProduct.price + '</h6>';
                        template += '  </div>';
                        template += '</div>';
                    }
                    jQuery("#product_list").append(template);
                }
            },
            error: function (request) {
                console.log(request);
                alert(request.responseJSON.fault.type + ":" + request.responseJSON.fault.message);

            }

        });

    },
    createCart: function (config) {
        //getFunction(arguments.callee.toString());
        $.ajax({
            type: "POST",
            beforeSend: function (xhr) {

                xhr.setRequestHeader("Authorization", customer.Authorization);
                xhr.setRequestHeader("x-dw-client-id", config.client_id);
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.setRequestHeader("callurl", config.basket_url);
            },
            url: config.proxy_url,
            dataType: 'json',
            method: 'POST',
            contentType: 'application/json',
            async: false,
            //data: '{ "type" : "credentials" }',
            success: function (data, textStatus, request) {
                if (data.fault == undefined) {

                } else {

                    customer.basket_id = data.basket_id;
                    //console.log('basket_id : ' + customer.basket_id)
                }


            },
            error: function (request) {
                console.log(request);
                alert(request.responseJSON.fault.type + ":" + request.responseJSON.fault.message);

            }

        });

    },


    getBaskets: function (config) {
        var customer = Util.loadSettings();
        $.ajax({
            type: "GET",
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", customer.Authorization);
                xhr.setRequestHeader("x-dw-client-id", config.client_id);
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.setRequestHeader("callurl", config.baskets_url + "/" + customer.customer_id + "/baskets");
                console.log(config.baskets_url + "/" + customer.customer_id + "/baskets");
            },
            url: config.proxy_url,
            dataType: 'json',
            method: 'GET',
            contentType: 'application/json',
            async: false,
            success: function (data, textStatus, request) {
                console.log('data.total : ' + data.total);
                if (data.total == 1) {


                    customer.basket_id = data.baskets[0].basket_id;

                    Util.saveSettings();

                    console.log("getBaskets: customer: " + customer.customer_id);
                    console.log("getBaskets: basket: " + customer.basket_id);
                }

                if (data.total == 0) {
                    //OCAPI.createCart(settings);
                    //OCAPI.getBaskets(settings);
                    OCAPI.getCart(settings);
                }

                //console.log('basket_id : ' + data.baskets[0].basket_id)

            },
            error: function (request) {
                console.log(request);
                alert(request.responseJSON.fault.type + ":" + request.responseJSON.fault.message);

            }

        });

    },
    getCart: function (config) {
        var customer = Util.loadSettings();
        $.ajax({
            type: "GET",
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", customer.Authorization);
                xhr.setRequestHeader("x-dw-client-id", config.client_id);
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.setRequestHeader("callurl", config.basket_url + "/" + customer.basket_id);
            },
            url: config.proxy_url,
            dataType: 'json',
            method: 'GET',
            contentType: 'application/json',
            async: false,
            //data: '{ "type" : "credentials" }',
            success: function (data, textStatus, request) {

                customer.ETag = data.ETag;
                Util.saveSettings();

                console.log("getCart: customer: " + customer.customer_id);
                console.log("getCart: basket: " + customer.basket_id);
                console.log("ETag: " + customer.ETag);
                var productLineItems = "";
                var pliImages = [];
                if (data.product_items != undefined) {

                    if (data.product_items == undefined || data.product_items.length == 0) {

                    } else {
                        jQuery("#mini-cart-count").text(data.product_items.length);
                        jQuery("#mini-cart-count").show();

                        jQuery("#product_sub_total").text("$" + data.product_sub_total);
                        jQuery("#product_total").text("$" + data.product_total);
                    }
                    for (i = 0; i < data.product_items.length; i++) {
                        var pli = data.product_items[i];
                        productLineItems += OCAPI.buildPli(pli);
                        pliImages.push(pli.product_id);
                    }
                    $("#cart-content-product").html(productLineItems);
                    //console.log("found: " +  $("#cart-content-product").length);

                    for (i = 0; i < pliImages.length; i++) {
                        var pliImage = pliImages[i];
                        OCAPI.getProduct(settings, pliImage);
                    }
                }

            },
            error: function (request) {
                console.log(request);
                alert(request.responseJSON.fault.type + ":" + request.responseJSON.fault.message);

            }

        });

    },
    getCartCB: function (config, callback) {
        //getFunction(arguments.callee.toString());
        var customer = Util.loadSettings();
        $.ajax({
            type: "GET",
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", customer.Authorization);
                xhr.setRequestHeader("x-dw-client-id", config.client_id);
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.setRequestHeader("callurl", config.basket_url + "/" + customer.basket_id);
            },
            url: config.proxy_url,
            dataType: 'json',
            method: 'GET',
            contentType: 'application/json',
            async: false,
            //data: '{ "type" : "credentials" }',
            success: function (data, textStatus, request) {

                customer.ETag = data.ETag;
                Util.saveSettings();

                console.log("getCart->customer: " + customer.customer_id);
                console.log("getCart->basket: " + customer.basket_id);
                console.log("ETag: " + customer.ETag);

                var productLineItems = "";
                var pliImages = [];
                if (data.product_items != undefined) {

                    if (data.product_items == undefined || data.product_items.length == 0) {

                    } else {
                        jQuery("#mini-cart-count").text(data.product_items.length);
                        jQuery("#mini-cart-count").show();

                        jQuery("#product_sub_total").text("$" + data.product_sub_total);
                        jQuery("#product_total").text("$" + data.product_total);
                    }
                    for (i = 0; i < data.product_items.length; i++) {
                        var pli = data.product_items[i];
                        productLineItems += OCAPI.buildPli(pli);
                        pliImages.push(pli.product_id);
                    }
                    $("#cart-content-product").html(productLineItems);

                    for (i = 0; i < pliImages.length; i++) {
                        var pliImage = pliImages[i];
                        OCAPI.getProduct(settings, pliImage);
                    }
                }

                callback(config);

            },
            error: function (request) {
                console.log(request);
                alert(request.responseJSON.fault.type + ":" + request.responseJSON.fault.message);

            }

        });

    },
    deleteCart: function () {

    },
    addProductToCart: function (config, pid) {
        var customer = Util.loadSettings();
        $.ajax({
            type: "POST",
            beforeSend: function (xhr) {
                //add back authorization
                xhr.setRequestHeader("Authorization", customer.Authorization);
                xhr.setRequestHeader("x-dw-client-id", config.client_id);
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.setRequestHeader("callurl", config.basket_url + "/" + customer.basket_id + "/items");
                xhr.setRequestHeader("If-Match", customer.ETag);
                console.log(config.basket_url + "/" + customer.basket_id + "/items");

            },
            url: config.proxy_url,
            dataType: 'json',
            method: 'POST',
            contentType: 'application/json',
            async: false,
            data: '[{"product_id" : "' + pid + '","quantity" : 1}]',
            success: function (data, textStatus, request) {

                if (data.fault == undefined) { /*error;*/
                    console.log('Product Added');
                    alert('Product Added');
                    OCAPI.getCart(settings);
                } else {
                    console.log('Product Error');
                    alert('Error Product Not Added to Cart');
                }
            },
            error: function (request) {
                console.log(request);
                alert(request.responseJSON.fault.type + ":" + request.responseJSON.fault.message);

            }

        });
    },
    removeProductFromCart: function (config, thisObj) {
        var customer = Util.loadSettings();
        var item_id = $(thisObj).attr('item_id');
        $.ajax({
            type: "DELETE",
            beforeSend: function (xhr) {
                //add back authorization
                xhr.setRequestHeader("Authorization", customer.Authorization);
                xhr.setRequestHeader("x-dw-client-id", config.client_id);
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.setRequestHeader("x-dw-http-method-override", "DELETE");

                xhr.setRequestHeader("callurl", config.basket_url + "/" + customer.basket_id + "/items/" + item_id);
                xhr.setRequestHeader("If-Match", customer.ETag);
                console.log(config.basket_url + "/" + customer.basket_id + "/items/" + item_id);

            },
            url: config.proxy_url,
            dataType: 'json',
            method: 'DELETE',
            contentType: 'application/json',
            async: false,
            //data: '{"product_id":"'+pid+'","quantity":0}',
            success: function (data, textStatus, request) {

                window.location = "cart.html";
            },
            error: function (request) {
                console.log(request);
                //alert(request.responseJSON.fault.type + ":" + //request.responseJSON.fault.message);

            }

        });
    },
    viewCart: function (config) {
        console.log('viewCart running');
        var customer = Util.loadSettings();
        OCAPI.getBaskets(config);
        OCAPI.getCart(config);

    },
    buildPli: function (pli) {


        var buildStr = "";
        buildStr += '     <div class="row">';
        buildStr += ' 	<div class="col s12">';
        buildStr += ' 		<div class="cart-details">';
        buildStr += ' 			<div class="col s5">';
        buildStr += ' 				<div class="cart-product">';
        buildStr += ' 					<h5>Image</h5>';
        buildStr += ' 				</div>';
        buildStr += ' 			</div>';
        buildStr += ' 			<div class="col s7">';
        buildStr += ' 				<div class="cart-product">';
        buildStr += ' 					<img id="img_cart_' + pli.product_id + '" src="img/cart.png" alt="">';
        //console.log("img_cart_"+pli.product_id); 
        buildStr += ' 				</div>';
        buildStr += ' 			</div>';
        buildStr += ' 		</div>';
        buildStr += ' 		<div class="cart-details">';
        buildStr += ' 			<div class="col s5">';
        buildStr += ' 				<div class="cart-product">';
        buildStr += ' 					<h5>Name</h5>';
        buildStr += ' 				</div>';
        buildStr += ' 			</div>';
        buildStr += ' 			<div class="col s7">';
        buildStr += ' 				<div class="cart-product">';
        buildStr += ' 					<a href="">' + pli.item_text + '</a>';
        buildStr += ' 				</div>';
        buildStr += ' 			</div>';
        buildStr += ' 		</div>';
        buildStr += '    <div class="cart-details">';
        buildStr += '      <div class="col s5">';
        buildStr += '        <div class="cart-product">';
        buildStr += '          <h5>Quantity</h5>';
        buildStr += '        </div>';
        buildStr += '      </div>';
        buildStr += '       <div class="col s7">';
        buildStr += '         <div class="cart-product">';
        buildStr += '           <input type="text" value="' + pli.quantity + '">';
        buildStr += '         </div>';
        buildStr += '        </div>';
        buildStr += '     </div>';
        buildStr += '      <div class="cart-details">';
        buildStr += '        <div class="col s5">';
        buildStr += '          <div class="cart-product">';
        buildStr += '           <h5>Unit Price</h5>';
        buildStr += '         </div>';
        buildStr += '       </div>';
        buildStr += '       <div class="col s7">';
        buildStr += '         <div class="cart-product">';
        buildStr += '           <span>$' + pli.price + '</span>';
        buildStr += '        </div>';
        buildStr += '      </div>';
        buildStr += '    </div>';

        buildStr += ' 		<div class="cart-details">';
        buildStr += ' 			<div class="col s5">';
        buildStr += ' 				<div class="cart-product">';
        buildStr += ' 					<h5>Action</h5>';
        buildStr += ' 				</div>';
        buildStr += ' 			</div>';
        buildStr += ' 			<div class="col s7">';
        buildStr += ' 				<div class="cart-product">';
        buildStr += ' 					<a item_id="' + pli.item_id + '" pid="' + pli.product_id + '" href="#" onClick="OCAPI.removeProductFromCart(settings,this)"><i style="font-size:x-large" class="fa fa-trash"></i></a>';
        buildStr += ' 				</div>';
        buildStr += ' 			</div>';
        buildStr += ' 		</div>';
        buildStr += ' </div>';
        buildStr += '  </div>';

        return buildStr;
    },
    getAddresses: function (config) {

        var customer = Util.loadSettings();
        $.ajax({
            type: "GET",
            beforeSend: function (xhr) {
                //add back authorization
                xhr.setRequestHeader("Authorization", customer.Authorization);
                xhr.setRequestHeader("x-dw-client-id", config.client_id);
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.setRequestHeader("callurl", config.baskets_url + "/" + customer.customer_id + "/addresses");
                //xhr.setRequestHeader("If-Match",customer.ETag);
                console.log(config.baskets_url + "/" + customer.customer_id + "/addresses");

            },
            url: config.proxy_url,
            dataType: 'json',
            method: 'GET',
            contentType: 'application/json',
            async: false,
            //data: '[{"product_id" : "'+pid+'","quantity" : 1}]',
            success: function (data, textStatus, request) {

                if (data.fault != undefined && data.count != 0) { /*error;*/
                    //console.log('No addresses found');


                } else {
                    //alert('Addresses found');
                    var address1 = data.data[0]; //get first address;
                    customer.addresses = [];
                    customer.addresses.push(address1);
                    Util.saveSettings(customer);

                    jQuery("#billing_name").val(address1.full_name);
                    jQuery("#billing_email").val(customer.email);
                    jQuery("#billing_company").val("N/A");
                    jQuery("#billing_address").val(address1.address1);
                    jQuery("#billing_city").val(address1.city);
                    jQuery("#billing_zip").val(address1.postal_code);
                    jQuery("#billing_state").val(address1.country_code);
                    jQuery("#billing_phone").val(address1.phone);

                    jQuery("#shipping_name").val(address1.full_name);
                    jQuery("#shipping_email").val(customer.email);
                    jQuery("#shipping_company").val("N/A");
                    jQuery("#shipping_address").val(address1.address1);
                    jQuery("#shipping_city").val(address1.city);
                    jQuery("#shipping_zip").val(address1.postal_code);
                    jQuery("#shipping_state").val(address1.country_code);
                    jQuery("#shipping_phone").val(address1.phone);

                }
            },
            error: function (request) {
                console.log(request);
                alert(request.responseJSON.fault.type + ":" + request.responseJSON.fault.message);

            }

        });

    },

    preCheckCheckout: function () {
        var customer = Util.loadSettings();
        var headers = jQuery(".collapsible-header");
        jQuery(".collapsible-header").removeClass("active");


        if (customer.customer_id == undefined) {
            jQuery("#step1").click();

        } else {

            jQuery("#step2").click();

        }

        OCAPI.getAddresses(settings);

        //validate
        var billing_form_items = $("#billing_form").find("input");
        var shipping_form_items = $("#shipping_form").find("input");
        var thisElem = "";
        for (i = 0; i < billing_form_items.length; i++) {
            thisElem = $(billing_form_items[i]);
            if ($(thisElem).val().length == 0) {
                alert("Missing field: " + $(thisElem).attr('id'));
                jQuery("#step2").click();
                return;
            }
        }

        for (i = 0; i < shipping_form_items.length; i++) {
            thisElem = $(shipping_form_items[i]);
            if ($(thisElem).val().length == 0) {
                alert("Missing field");
                alert("Missing field: " + $(thisElem).attr('id'));
                jQuery("#step3").click();
                return;
            }
        }
        //check the card

        //OCAPI.addShippingBilling(settings);
        //OCAPI.addPayment(settings);


    },
    addShippingBilling2: function (config) {
        var customer = Util.loadSettings();
        var addressBody = {


            "shipping_method": {
                "id": "001"
            },
            "shipping_address": {
                "first_name": "John",
                "last_name": "Smith",
                "city": "Boston",
                "address1": "123 street",
                "country_code": "US",
            },
            "c_somestring": "shipment_custom_property"
        };
        $.ajax({
            type: "POST",
            beforeSend: function (xhr) {
                //add back authorization
                xhr.setRequestHeader("Authorization", customer.Authorization);
                xhr.setRequestHeader("x-dw-client-id", config.client_id);
                //xhr.setRequestHeader("x-dw-http-method-override","POST");
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.setRequestHeader("callurl", config.basket_url + "/" + customer.basket_id + "/shipments");
                xhr.setRequestHeader("If-Match", customer.ETag);
                console.log(config.basket_url + "/" + customer.basket_id + "/shipments");

            },
            url: config.proxy_url,
            dataType: 'json',
            method: 'POST',
            contentType: 'application/json',
            async: false,
            data: JSON.stringify(addressBody),
            success: function (data, textStatus, request) {

                if (data.fault == undefined) { /*error;*/


                    alert('Address Added');
                    OCAPI.getCart(config);
                } else {
                    alert(data.fault.message);
                }
            },
            error: function (request) {
                console.log(request);
                alert(request.responseJSON.fault.type + ":" + request.responseJSON.fault.message);

            }
        });
    },
    addShippingBilling: function (config) {
        var customer = Util.loadSettings();
        var addressBody = {

            "id": "StandardShipping",
            "shipping_method": {
                "id": "001",
                "name": "Base Shipping Method",
                "price": 5.55
            },
            "shipping_address": {
                "first_name": "John",
                "last_name": "Smith",
                "city": "Boston",
                "address1": "123 street",
                "country_code": "US",
            },
            "c_somestring": "shipment_custom_property"
        };

        $.ajax({
            type: "PUT",
            beforeSend: function (xhr) {
                //add back authorization
                xhr.setRequestHeader("Authorization", customer.Authorization);
                xhr.setRequestHeader("x-dw-client-id", config.client_id);
                xhr.setRequestHeader("x-dw-http-method-override", "PUT");
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.setRequestHeader("callurl", config.basket_url + "/" + customer.basket_id + "/shipments/me/shipping_address?use_as_billing=true");
                xhr.setRequestHeader("If-Match", customer.ETag);
                console.log(config.basket_url + "/" + customer.basket_id + "/shipments/me/shipping_address?use_as_billing=true");

            },
            url: config.proxy_url,
            dataType: 'json',
            method: 'PUT',
            contentType: 'application/json',
            async: false,
            data: JSON.stringify(addressBody),
            success: function (data, textStatus, request) {

                if (data.fault == undefined) { /*error;*/


                    alert('Address Added');
                    OCAPI.getCart(config);
                } else {
                    alert(data.fault.message);
                }
            },
            error: function (request) {
                console.log(request);
                alert(request.responseJSON.fault.type + ":" + request.responseJSON.fault.message);

            }
        });
    },
    addPayment: function (config) {
        var customer = Util.loadSettings();
        var card = {
            "amount": 1.00,
            "payment_card": {
                "number": "411111111111111",
                "security_code": 121,
                "holder": "John Doe",
                "card_type": "Visa",
                "expiration_month": 1,
                "expiration_year": 2021
            },
            "payment_method_id": "CREDIT_CARD"

        };
        card.amount = parseFloat(parseFloat(jQuery("#product_sub_total").text().replace('$', '')).toFixed(2));
        card.payment_card.number = jQuery("#card_number").val();
        card.payment_card.expiration_month = parseInt(jQuery("#exp_month").val());
        card.payment_card.expiration_year = parseInt(jQuery("#exp_year").val());
        card.payment_card.security_code = jQuery("#card_cvv").val().toString();

        $.ajax({
            type: "POST",
            beforeSend: function (xhr) {
                //add back authorization
                xhr.setRequestHeader("Authorization", customer.Authorization);
                xhr.setRequestHeader("x-dw-client-id", config.client_id);
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.setRequestHeader("callurl", config.basket_url + "/" + customer.basket_id + "/payment_instruments");
                xhr.setRequestHeader("If-Match", customer.ETag);
                console.log(config.basket_url + "/" + customer.basket_id + "/payment_instruments");

            },
            url: config.proxy_url,
            dataType: 'json',
            method: 'POST',
            contentType: 'application/json',
            async: false,
            data: JSON.stringify(card),
            success: function (data, textStatus, request) {
                if (data.fault == undefined) { /*error;*/


                    alert('Payment Added');
                    OCAPI.getCart(config);
                } else {
                    alert(data.fault.message);
                }
            },
            error: function (request) {
                console.log(request);
                alert(request.responseJSON.fault.type + ":" + request.responseJSON.fault.message);

            }
        });
    },
    removePayment: function (config, thisObj) {
        var customer = Util.loadSettings();
        var payment_id = $(thisObj).attr('payment_id');
        $.ajax({
            type: "DELETE",
            beforeSend: function (xhr) {
                //add back authorization
                xhr.setRequestHeader("Authorization", customer.Authorization);
                xhr.setRequestHeader("x-dw-client-id", config.client_id);
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.setRequestHeader("x-dw-http-method-override", "DELETE");
                xhr.setRequestHeader("callurl", config.basket_url + "/" + customer.basket_id + "/payment_instruments/" + payment_id);
                xhr.setRequestHeader("If-Match", customer.ETag);
                console.log(config.basket_url + "/" + customer.basket_id + "/payment_instruments/" + payment_id);

            },
            url: config.proxy_url,
            dataType: 'json',
            method: 'DELETE',
            contentType: 'application/json',
            async: false,
            //data: JSON.stringify(card),
            success: function (data, textStatus, request) {

                if (data.fault == undefined) { /*error;*/


                    window.location.reload();
                } else {
                    alert(data.fault.message);
                }
            },
            error: function (request) {
                console.log(request);
                alert(request.responseJSON.fault.type + ":" + request.responseJSON.fault.message);

            }
        });
    },

    checkout: function (config) {
        //var customer = Util.loadSettings(); 

        OCAPI.getCartCB(config, OCAPI.addShippingBilling2);
        //OCAPI.addShippingBilling(config);

        //OCAPI.getCart(config);
        //OCAPI.addPayment(config);

        OCAPI.getCartCB(config, OCAPI.addPayment);
        //OCAPI.getCart(config);

        $.ajax({
            type: "POST",
            beforeSend: function (xhr) {
                //add back authorization
                xhr.setRequestHeader("Authorization", customer.Authorization);
                xhr.setRequestHeader("x-dw-client-id", config.client_id);
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.setRequestHeader("callurl", config.order_url);
                xhr.setRequestHeader("If-Match", customer.ETag);
                console.log(config.order_url);

            },
            url: config.proxy_url,
            dataType: 'json',
            method: 'POST',
            contentType: 'application/json',
            async: false,
            data: '{"basket_id" : "' + customer.basket_id + '"}',
            success: function (data, textStatus, request) {

                if (data.fault == undefined) { /*error;*/

                    window.location.reload();
                } else {
                    alert(data.fault.message);
                }
            },
            error: function (request) {
                console.log(request);
                alert(request.responseJSON.fault.type + ":" + request.responseJSON.fault.message);

            }
        });
    }
};