
// ── CACHE NUKE v3.0: clears stale SW + caches, one-time reload ─────────────
(function(){
  var CURRENT='mep-app-v5.31';
  var nuked=sessionStorage.getItem('cache-nuked');
  if(nuked===CURRENT)return; // already done this session
  function doNuke(){
    var p1=('caches' in window)?caches.keys().then(function(keys){return Promise.all(keys.map(function(k){return caches.delete(k);}));}):Promise.resolve();
    var p2=navigator.serviceWorker?navigator.serviceWorker.getRegistrations().then(function(regs){return Promise.all(regs.map(function(r){return r.unregister();}));}):Promise.resolve();
    return Promise.all([p1,p2]);
  }
  doNuke().then(function(){
    sessionStorage.setItem('cache-nuked',CURRENT);
    window.location.reload(true);
  }).catch(function(){
    sessionStorage.setItem('cache-nuked',CURRENT);
  });
})();
// ────────────────────────────────────────────────────────────────────────────
var DAYS=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
var CUISINE_FLAGS={Italian:'🇮🇹',Mexican:'🇲🇽',Asian:'🎌',Indian:'🇮🇳',Mediterranean:'🫒',British:'🇬🇧',American:'🇺🇸',Japanese:'🇯🇵',Thai:'🇹🇭',French:'🇫🇷'};
var weekStart=0; // index into DAYS: 0=Mon,1=Tue,...,6=Sun
var MT_BASE=['Breakfast','Lunch','Dinner','Snack'];
var MT=['Breakfast','Lunch','Dinner','Snack'];
function refreshMT(){MT=MT_BASE.concat(customMT.filter(function(t){return MT_BASE.indexOf(t)<0;}));}
var CUISINES=['Any','Italian','Mexican','Asian','Indian','Mediterranean','British','American','Japanese','Thai','French'];
var DIETS=['Vegan','Vegetarian','Pescatarian','Gluten-free','Dairy-free','Halal'];
var ALLERGENS=['Gluten','Dairy','Nuts','Eggs','Fish','Shellfish','Soya','Sesame','Celery','Mustard'];
var UNITS=['','g','kg','ml','l','tsp','tbsp','cup','oz','lb','clove(s)','slice(s)','bunch(es)','pinch','sprig(s)','can(s)'];
var PRODUCE=['onion','garlic','tomato','pepper','carrot','cucumber','avocado','lemon','mushroom','broccoli','cabbage','ginger','banana','blueberr','spinach','potato','courgette'];
var PROTEIN=['beef','chicken','fish','fillet','egg','pork','bacon','lamb','tofu','salmon','tuna','prawn'];
var DAIRY=['cheese','cream','butter','milk','parmesan','feta','yogurt','sour cream','creme','mozzarella'];
var PANTRY=['pasta','rice','spaghetti','arborio','flour','bread','oat','tortilla','stock','wine','oil','sauce','paste','tinned','can','almond milk','lentil','chickpea','bean','noodle'];
var SPICES=['salt','pepper','cumin','paprika','oregano','garam','chilli','masala','chia','sesame','soy','cinnamon','turmeric','flake','dried','pinch','cayenne','thyme','rosemary'];

var darkMode=false;
var collections=[];
var customMT=[];
var aCollection='All';
var weekOffset=0;
var DEFAULT_AISLE_ORDER=['Produce','Protein','Dairy','Pantry','Spices','Other'];
var aisleOrder=DEFAULT_AISLE_ORDER.slice();
var nrRating=0;
var STOCK_SECTIONS=[
  {id:'snack',name:'Snack cupboard'},
  {id:'meal',name:'Meal cupboard'},
  {id:'freezer',name:'Freezer'},
  {id:'baby',name:'Baby'}
];
var DEFAULT_STOCK_TEMPLATES=[
  {id:'tpl-baby-nappies',name:'Nappies',section:'baby',type:'changing',qty:1,targetQty:2,alert1:1,alert2:0,updatedAt:1},
  {id:'tpl-baby-wipes',name:'Wipes',section:'baby',type:'changing',qty:1,targetQty:3,alert1:1,alert2:0,updatedAt:1},
  {id:'tpl-baby-formula',name:'Formula',section:'baby',type:'feeding',qty:1,targetQty:2,alert1:1,alert2:0,updatedAt:1}
];
var stockItems=[];
var stockDeletes={};
var stockTemplates=[];
var stockTemplateDeletes={};
var activityLog=[];
var newbornChecklist=[];
var stockAlertState={};
var stockFilter='all';
var stockEditId=null;
var stockQuickSection='snack';
var recipeStockId=null;
var stockUseId=null;
var stockImgB64='';
var sleepyMode=false;
var lastActivitySeen=0;
var DEFAULT_NEWBORN_CHECKLIST=[];

// ── v5.5: SUPERMARKETS ────────────────────────────────────────────────────────
var SUPERMARKETS=[
  {id:'tesco',      name:'Tesco',       emoji:'🔵', tier:'mid',     tierLabel:'Mid-range', mult:1.00},
  {id:'asda',       name:'Asda',        emoji:'🟢', tier:'budget',  tierLabel:'Budget',    mult:0.90},
  {id:'morrisons',  name:'Morrisons',   emoji:'🟡', tier:'mid',     tierLabel:'Mid-range', mult:0.97},
  {id:'sainsburys', name:"Sainsbury's", emoji:'🟠', tier:'mid',     tierLabel:'Mid-range', mult:1.05},
  {id:'lidl',       name:'Lidl',        emoji:'🔴', tier:'budget',  tierLabel:'Budget',    mult:0.78},
  {id:'aldi',       name:'Aldi',        emoji:'🟤', tier:'budget',  tierLabel:'Budget',    mult:0.75},
  {id:'ms',         name:'M&S',         emoji:'⚫', tier:'premium', tierLabel:'Premium',   mult:1.40},
  {id:'waitrose',   name:'Waitrose',    emoji:'🌿', tier:'premium', tierLabel:'Premium',   mult:1.35}
];
var AISLE_BASE_COST={Produce:0.85,Protein:2.80,Dairy:1.20,Pantry:1.10,Spices:0.60,Other:0.90};
var userSupermarket='tesco';

// ── v5.5: APPLIANCES ──────────────────────────────────────────────────────────
var ALL_APPLIANCES=[
  {id:'hob',          name:'Hob / Stovetop',  emoji:'🍳'},
  {id:'oven',         name:'Oven',             emoji:'🔥'},
  {id:'microwave',    name:'Microwave',        emoji:'📻'},
  {id:'airfryer',     name:'Air fryer',        emoji:'💨'},
  {id:'slowcooker',   name:'Slow cooker',      emoji:'🥘'},
  {id:'instantpot',   name:'Instant pot',      emoji:'⚡'},
  {id:'blender',      name:'Blender',          emoji:'🌀'},
  {id:'foodprocessor',name:'Food processor',   emoji:'⚙️'},
  {id:'standmixer',   name:'Stand mixer',      emoji:'🎂'},
  {id:'bbq',          name:'BBQ / Grill',      emoji:'🪵'},
  {id:'ricecooker',   name:'Rice cooker',      emoji:'🍚'},
  {id:'toaster',      name:'Toaster',          emoji:'🍞'}
];
var APPLIANCE_KEYWORDS={
  oven:['bake','roast','oven','broil','casserole','fan oven','preheated','180c','200c','degrees c','°c'],
  microwave:['microwave','nuke'],
  airfryer:['air fry','airfry','air-fry'],
  slowcooker:['slow cook','slow-cook','crockpot','low and slow'],
  instantpot:['instant pot','pressure cook','pressure-cook'],
  blender:['blend','blender','smoothie','purée','puree','liquidise','liquidize'],
  foodprocessor:['food processor','food-processor','pulse until'],
  standmixer:['stand mixer','stand-mixer','beat until fluffy','cream the butter'],
  bbq:['bbq','barbecue','barbecued','charcoal','griddle'],
  ricecooker:['rice cooker']
};
var userAppliances=[];

var recipes=[
  {id:1,name:'Spaghetti Bolognese',cuisine:'Italian',diets:[],allergens:['Gluten','Dairy'],time:40,desc:'Classic Italian meat sauce pasta',ingredients:[{name:'spaghetti',qty:400,unit:'g'},{name:'minced beef',qty:500,unit:'g'},{name:'onion',qty:1,unit:''},{name:'garlic',qty:3,unit:'clove(s)'},{name:'tinned tomatoes',qty:1,unit:'can(s)'},{name:'tomato paste',qty:2,unit:'tbsp'},{name:'parmesan',qty:60,unit:'g'},{name:'olive oil',qty:2,unit:'tbsp'}],steps:['Heat olive oil in a large pan over medium heat. Finely dice the onion and cook for 5 minutes until soft.','Add minced garlic and cook for 1 minute until fragrant.','Add minced beef and cook, breaking it apart, until browned all over — about 8 minutes.','Stir in tomato paste and cook for 2 minutes. Add tinned tomatoes, season well, and simmer on low heat for 20 minutes.','Cook spaghetti in well-salted boiling water according to packet instructions. Reserve a cup of pasta water before draining.','Toss drained pasta with the sauce, adding a splash of pasta water to loosen. Serve topped with grated parmesan.']},
  {id:2,name:'Veggie Stir Fry',cuisine:'Asian',diets:['Vegan','Vegetarian'],allergens:['Soya','Sesame'],time:20,desc:'Quick colourful vegetable stir fry',ingredients:[{name:'broccoli',qty:200,unit:'g'},{name:'red pepper',qty:1,unit:''},{name:'carrot',qty:2,unit:''},{name:'garlic',qty:2,unit:'clove(s)'},{name:'soy sauce',qty:3,unit:'tbsp'},{name:'sesame oil',qty:1,unit:'tbsp'},{name:'ginger',qty:1,unit:'tsp'},{name:'rice',qty:300,unit:'g'}],steps:['Cook rice according to packet instructions. Keep warm.','Chop broccoli into small florets, slice the red pepper and carrot into thin strips.','Heat a wok or large frying pan on high heat until very hot. Add a splash of oil.','Stir fry carrots and broccoli for 3 minutes. Add red pepper and cook for 2 more minutes.','Add garlic and ginger, stir fry for 30 seconds. Pour in soy sauce and sesame oil.','Toss everything together for 1 minute until glossy. Serve immediately over rice.']},
  {id:3,name:'Avocado Toast',cuisine:'American',diets:['Vegan','Vegetarian'],allergens:['Gluten'],time:10,desc:'Simple nutritious breakfast',ingredients:[{name:'sourdough bread',qty:2,unit:'slice(s)'},{name:'avocado',qty:1,unit:''},{name:'lemon',qty:0.5,unit:''},{name:'chilli flakes',qty:1,unit:'pinch'},{name:'salt',qty:1,unit:'pinch'}]},
  {id:4,name:'Chicken Tikka Masala',cuisine:'Indian',diets:[],allergens:['Dairy'],time:45,desc:'Rich creamy curry',ingredients:[{name:'chicken breast',qty:600,unit:'g'},{name:'onion',qty:1,unit:''},{name:'garlic',qty:4,unit:'clove(s)'},{name:'tinned tomatoes',qty:1,unit:'can(s)'},{name:'double cream',qty:150,unit:'ml'},{name:'tikka masala paste',qty:3,unit:'tbsp'},{name:'garam masala',qty:1,unit:'tsp'},{name:'rice',qty:300,unit:'g'}],steps:['Cut chicken into bite-sized chunks. Season and coat with half the tikka masala paste. Set aside for 10 minutes.','Cook rice in boiling salted water according to packet instructions.','Fry diced onion in oil over medium heat for 8 minutes until golden. Add garlic and remaining paste, cook 2 minutes.','Add the marinated chicken and cook for 5 minutes, turning to brown all over.','Pour in tinned tomatoes and simmer for 15 minutes until chicken is cooked through.','Reduce heat to low, stir in double cream and garam masala. Simmer gently for 5 minutes. Serve over rice.']},
  {id:5,name:'Greek Salad',cuisine:'Mediterranean',diets:['Vegetarian','Gluten-free'],allergens:['Dairy'],time:10,desc:'Fresh light summer salad',ingredients:[{name:'cucumber',qty:1,unit:''},{name:'tomato',qty:3,unit:''},{name:'red onion',qty:0.5,unit:''},{name:'feta cheese',qty:150,unit:'g'},{name:'olives',qty:50,unit:'g'},{name:'olive oil',qty:3,unit:'tbsp'},{name:'dried oregano',qty:1,unit:'tsp'}]},
  {id:6,name:'Mushroom Risotto',cuisine:'Italian',diets:['Vegetarian','Gluten-free'],allergens:['Dairy'],time:35,desc:'Creamy arborio rice with mushrooms',ingredients:[{name:'arborio rice',qty:320,unit:'g'},{name:'mushrooms',qty:400,unit:'g'},{name:'onion',qty:1,unit:''},{name:'garlic',qty:2,unit:'clove(s)'},{name:'parmesan',qty:80,unit:'g'},{name:'butter',qty:40,unit:'g'},{name:'white wine',qty:150,unit:'ml'},{name:'vegetable stock',qty:1,unit:'l'}],steps:['Warm the stock in a saucepan and keep on a low simmer. Slice mushrooms thickly.','Fry mushrooms in butter over high heat until golden — about 5 minutes. Set aside.','In the same pan, soften diced onion and garlic over medium heat for 5 minutes.','Add arborio rice and stir for 2 minutes until translucent at the edges. Pour in white wine and stir until absorbed.','Add stock one ladle at a time, stirring constantly and waiting until each ladle is absorbed before adding the next — about 18 minutes total.','Stir in the mushrooms, remaining butter and grated parmesan. Season well. Rest for 2 minutes before serving.']},
  {id:7,name:'Fish Tacos',cuisine:'Mexican',diets:['Pescatarian'],allergens:['Gluten','Fish'],time:25,desc:'Crispy fish with zesty slaw',ingredients:[{name:'white fish fillet',qty:400,unit:'g'},{name:'flour tortillas',qty:6,unit:''},{name:'red cabbage',qty:200,unit:'g'},{name:'lemon',qty:1,unit:''},{name:'sour cream',qty:100,unit:'ml'},{name:'cumin',qty:1,unit:'tsp'},{name:'paprika',qty:1,unit:'tsp'},{name:'avocado',qty:1,unit:''}]},
  {id:8,name:'Overnight Oats',cuisine:'British',diets:['Vegan','Vegetarian'],allergens:['Gluten'],time:5,desc:'Easy make-ahead breakfast',ingredients:[{name:'rolled oats',qty:80,unit:'g'},{name:'almond milk',qty:200,unit:'ml'},{name:'banana',qty:1,unit:''},{name:'chia seeds',qty:1,unit:'tbsp'},{name:'honey',qty:1,unit:'tbsp'},{name:'blueberries',qty:50,unit:'g'}]}
];
var plan={Monday:[],Tuesday:[],Wednesday:[],Thursday:[],Friday:[],Saturday:[{recipeId:1,mealType:'Dinner'},{recipeId:3,mealType:'Breakfast'}],Sunday:[{recipeId:5,mealType:'Lunch'}]};
var planMeta={};
var planMealDeletes={};
var checked={};
var extraItems=[];
var recipeDeletes={};
var recipeImages={};
var userAllergens=[];var userDiet=null;
var aCuisine='Any';var aDiet='Any';
var amDay=DAYS[0];var amRecipe=null;var amType='Dinner';var amMode='recipe';var amIngN=0;
var nrDiets=[];var nrAllergens=[];var nrAppliances=[];var ingN=0;var stepN=0;var editId=null;
var fbConn=false;var fbRef=null;var fbPlanLoaded = false;
var fbCfg={url:'',key:'',proj:'',who:'',workspace:'',vapid:''};
var fbClientId='client-'+Date.now()+'-'+Math.random().toString(36).slice(2);
var fbStateLoaded=false;var fbBootstrappingState=false;var pendingSharedWrites=0;
var API_KEY='';

function recipeKey(r){return r&&r.id!==undefined&&r.id!==null?String(r.id):'';}
function recipeUpdatedAt(r){return parseInt(r&&(r.updatedAt||r.lastCooked||0),10)||0;}
function cloneRecipe(r){return JSON.parse(JSON.stringify(r));}
function recipesSame(a,b){return JSON.stringify(a||[])===JSON.stringify(b||[]);}
function simpleHash(s){
  s=String(s||'');
  var h=0;
  for(var i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h|=0;}
  return Math.abs(h).toString(36);
}
function newId(prefix){return prefix+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,8);}
function normaliseStampMap(map){
  var out={};
  if(!map||typeof map!=='object'||Array.isArray(map))return out;
  Object.keys(map).forEach(function(k){
    var v=map[k];
    var ts=typeof v==='object'&&v?parseInt(v.deletedAt||v.updatedAt||v.ts,10):parseInt(v,10);
    if(ts)out[String(k)]=ts;
  });
  return out;
}
function mealSig(m){
  return [m.recipeId||'',m.manualName||'',m.mealType||'',m.note||'',m.servings||''].join('|');
}
function legacyMealId(dateKey,m,index){
  return 'legacy-'+dateKey+'-'+index+'-'+simpleHash(mealSig(m));
}
function normaliseMeal(m,dateKey,index){
  if(!m||typeof m!=='object')return null;
  var out={};
  Object.keys(m).forEach(function(k){
    if(m[k]!==undefined&&m[k]!==null)out[k]=m[k];
  });
  out.recipeId=parseInt(out.recipeId,10)||out.recipeId;
  if(out.recipeId==='')delete out.recipeId;
  if(out.manualName!==undefined){
    out.manualName=String(out.manualName).trim();
    if(!out.manualName)delete out.manualName;
  }
  if(out.manualTime!==undefined){
    out.manualTime=Math.max(0,parseInt(out.manualTime,10)||0);
    if(!out.manualTime)delete out.manualTime;
  }
  if(Array.isArray(out.manualIngredients)){
    out.manualIngredients=out.manualIngredients.map(function(ing){
      if(!ing||typeof ing!=='object')return null;
      var name=String(ing.name||'').trim();
      if(!name)return null;
      var qty=parseFloat(ing.qty);
      return{name:name,qty:qty>0?qty:1,unit:String(ing.unit||'').trim()};
    }).filter(Boolean);
    if(!out.manualIngredients.length)delete out.manualIngredients;
  }
  if(out.recipeId===undefined&&!out.manualName)return null;
  out.id=out.id||legacyMealId(dateKey,out,index||0);
  out.updatedAt=parseInt(out.updatedAt,10)||0;
  if(out.note!==undefined){
    out.note=String(out.note).trim();
    if(!out.note)delete out.note;
  }
  return cleanForFirebase(out)||null;
}
function normalisePlanObject(planData){
  var out={};
  if(!planData||typeof planData!=='object'||Array.isArray(planData))return out;
  Object.keys(planData).forEach(function(dateKey){
    out[dateKey]=(Array.isArray(planData[dateKey])?planData[dateKey]:[]).map(function(m,i){
      return normaliseMeal(m,dateKey,i);
    }).filter(Boolean);
  });
  return out;
}
function recipeImagesFrom(list){
  var imgs={};
  (Array.isArray(list)?list:[]).forEach(function(r){
    var id=recipeKey(r);
    if(id&&r.image)imgs[id]=r.image;
  });
  return imgs;
}
function recipesForState(list){
  return (Array.isArray(list)?list:[]).map(function(r){
    var copy=cloneRecipe(normaliseRecipe(r));
    var id=recipeKey(copy);
    if(id&&copy.image)recipeImages[id]=copy.image;
    delete copy.image;
    return copy;
  });
}
function attachRecipeImages(list,preserveExisting){
  preserveExisting=preserveExisting!==false;
  return (Array.isArray(list)?list:[]).map(function(r){
    var copy=cloneRecipe(r);
    var id=recipeKey(copy);
    copy.image=(id&&recipeImages[id])||(preserveExisting?copy.image:'')||'';
    return copy;
  });
}
function mergePlanMeals(remoteMeals,localMeals,remoteDeletes,localDeletes,dateKey){
  remoteDeletes=normaliseStampMap(remoteDeletes);
  localDeletes=normaliseStampMap(localDeletes);
  var deletes={},byId={},order=[],mergedDeletes={};
  Object.keys(remoteDeletes).forEach(function(id){deletes[id]=Math.max(deletes[id]||0,remoteDeletes[id]);});
  Object.keys(localDeletes).forEach(function(id){deletes[id]=Math.max(deletes[id]||0,localDeletes[id]);});
  function remember(m){
    if(!m)return;
    if(!byId[m.id])order.push(m.id);
    var existing=byId[m.id];
    if(!existing||(m.updatedAt||0)>=(existing.updatedAt||0))byId[m.id]=m;
  }
  (Array.isArray(remoteMeals)?remoteMeals:[]).map(function(m,i){return normaliseMeal(m,dateKey,i);}).forEach(remember);
  (Array.isArray(localMeals)?localMeals:[]).map(function(m,i){return normaliseMeal(m,dateKey,i);}).forEach(remember);
  var items=[];
  order.forEach(function(id){
    var meal=byId[id];
    var deleteTs=deletes[id]||0;
    if(deleteTs&&deleteTs>=(meal.updatedAt||0)){mergedDeletes[id]=deleteTs;return;}
    items.push(meal);
  });
  Object.keys(deletes).forEach(function(id){if(!byId[id])mergedDeletes[id]=deletes[id];});
  return{items:items,deletes:mergedDeletes};
}
function planMealsSame(a,b){return JSON.stringify(a||[])===JSON.stringify(b||[]);}
function cleanPlanMeta(meta){
  var out={};
  if(!meta||typeof meta!=='object'||Array.isArray(meta))return out;
  Object.keys(meta).forEach(function(k){
    var m=meta[k]||{};
    var updatedAt=parseInt(m.updatedAt||m.ts,10)||0;
    var deletedAt=parseInt(m.deletedAt,10)||0;
    if(updatedAt||deletedAt)out[k]={updatedAt:updatedAt||deletedAt,deletedAt:deletedAt||0,clientId:m.clientId||'',inferred:!!m.inferred};
  });
  return out;
}
function touchPlanDate(dateKey,ts){
  if(!dateKey)return;
  ts=ts||Date.now();
  var meals=plan[dateKey]||[];
  planMeta[dateKey]={updatedAt:ts,clientId:fbClientId};
  if(!meals.length)planMeta[dateKey].deletedAt=ts;
}
function deletePlanMeal(dateKey,meal,ts){
  if(!meal)return;
  ts=ts||Date.now();
  var norm=normaliseMeal(meal,dateKey,0);
  if(norm&&norm.id)planMealDeletes[norm.id]=ts;
}
function mergeRecipeLists(localItems, remoteItems, localTs, remoteTs, localDeleted, remoteDeleted){
  localItems=Array.isArray(localItems)?localItems:[];
  remoteItems=Array.isArray(remoteItems)?remoteItems:[];
  localDeleted=normaliseStampMap(localDeleted);
  remoteDeleted=normaliseStampMap(remoteDeleted);
  var mergedDeleted={};
  var localById={},remoteById={},order=[],seenOrder={};
  function remember(id){if(id&&!seenOrder[id]){seenOrder[id]=true;order.push(id);}}
  localItems.forEach(function(r){var id=recipeKey(r);if(id){localById[id]=normaliseRecipe(cloneRecipe(r));remember(id);}});
  remoteItems.forEach(function(r){var id=recipeKey(r);if(id){remoteById[id]=normaliseRecipe(cloneRecipe(r));remember(id);}});
  Object.keys(localDeleted).forEach(remember);
  Object.keys(remoteDeleted).forEach(remember);

  var needsPush=false;
  var merged=[];
  order.forEach(function(id){
    var l=localById[id],r=remoteById[id];
    var deleteTs=Math.max(localDeleted[id]||0,remoteDeleted[id]||0);
    var recipeTs=Math.max(recipeUpdatedAt(l),recipeUpdatedAt(r));
    if(deleteTs&&deleteTs>=recipeTs){
      mergedDeleted[id]=deleteTs;
      if((localDeleted[id]||0)>(remoteDeleted[id]||0))needsPush=true;
      return;
    }
    if(l&&!r){needsPush=true;merged.push(l);return;}
    if(!l&&r){merged.push(r);return;}
    var lu=recipeUpdatedAt(l),ru=recipeUpdatedAt(r);
    var preferRemote=(lu||ru)?ru>=lu:remoteTs>=localTs;
    if(!preferRemote)needsPush=true;
    merged.push(preferRemote?r:l);
  });
  return{items:merged,deleted:mergedDeleted,needsPush:needsPush,changedLocal:!recipesSame(localItems,merged)};
}
function stockKey(item){return item&&item.id!==undefined&&item.id!==null?String(item.id):'';}
function stockUpdatedAt(item){return parseInt(item&&(item.updatedAt||0),10)||0;}
function stockSame(a,b){return JSON.stringify(a||[])===JSON.stringify(b||[]);}
function mergeStockLists(localItems,remoteItems,localDeleted,remoteDeleted){
  localItems=Array.isArray(localItems)?localItems:[];
  remoteItems=Array.isArray(remoteItems)?remoteItems:[];
  localDeleted=normaliseStampMap(localDeleted);
  remoteDeleted=normaliseStampMap(remoteDeleted);
  var mergedDeleted={},localById={},remoteById={},order=[],seen={};
  function remember(id){if(id&&!seen[id]){seen[id]=true;order.push(id);}}
  localItems.forEach(function(item){var copy=normaliseStockItem(item);var id=stockKey(copy);if(id){localById[id]=copy;remember(id);}});
  remoteItems.forEach(function(item){var copy=normaliseStockItem(item);var id=stockKey(copy);if(id){remoteById[id]=copy;remember(id);}});
  Object.keys(localDeleted).forEach(remember);
  Object.keys(remoteDeleted).forEach(remember);
  var needsPush=false,merged=[];
  order.forEach(function(id){
    var l=localById[id],r=remoteById[id];
    var deleteTs=Math.max(localDeleted[id]||0,remoteDeleted[id]||0);
    var itemTs=Math.max(stockUpdatedAt(l),stockUpdatedAt(r));
    if(deleteTs&&deleteTs>=itemTs){
      mergedDeleted[id]=deleteTs;
      if((localDeleted[id]||0)>(remoteDeleted[id]||0))needsPush=true;
      return;
    }
    if(l&&!r){needsPush=true;merged.push(l);return;}
    if(!l&&r){merged.push(r);return;}
    var preferRemote=stockUpdatedAt(r)>=stockUpdatedAt(l);
    if(!preferRemote)needsPush=true;
    merged.push(preferRemote?r:l);
  });
  return{items:merged,deleted:mergedDeleted,needsPush:needsPush,changedLocal:!stockSame(localItems,merged)};
}
function mergeStockTemplateLists(localItems,remoteItems,localDeleted,remoteDeleted){
  localItems=Array.isArray(localItems)?localItems:[];
  remoteItems=Array.isArray(remoteItems)?remoteItems:[];
  localDeleted=normaliseStampMap(localDeleted);
  remoteDeleted=normaliseStampMap(remoteDeleted);
  var mergedDeleted={},localById={},remoteById={},order=[],seen={};
  function remember(id){if(id&&!seen[id]){seen[id]=true;order.push(id);}}
  localItems.forEach(function(item){var copy=normaliseStockTemplate(item);var id=stockKey(copy);if(id){localById[id]=copy;remember(id);}});
  remoteItems.forEach(function(item){var copy=normaliseStockTemplate(item);var id=stockKey(copy);if(id){remoteById[id]=copy;remember(id);}});
  Object.keys(localDeleted).forEach(remember);
  Object.keys(remoteDeleted).forEach(remember);
  var needsPush=false,merged=[];
  order.forEach(function(id){
    var l=localById[id],r=remoteById[id];
    var deleteTs=Math.max(localDeleted[id]||0,remoteDeleted[id]||0);
    var itemTs=Math.max(stockUpdatedAt(l),stockUpdatedAt(r));
    if(deleteTs&&deleteTs>=itemTs){
      mergedDeleted[id]=deleteTs;
      if((localDeleted[id]||0)>(remoteDeleted[id]||0))needsPush=true;
      return;
    }
    if(l&&!r){needsPush=true;merged.push(l);return;}
    if(!l&&r){merged.push(r);return;}
    var preferRemote=stockUpdatedAt(r)>=stockUpdatedAt(l);
    if(!preferRemote)needsPush=true;
    merged.push(preferRemote?r:l);
  });
  return{items:merged,deleted:mergedDeleted,needsPush:needsPush};
}
function mergeRemotePlan(planItems, remoteMeta, changedDateKey, remoteTs){
  var normalisedPlan=normaliseIds({recipes:[],plan:planItems||{}}).plan;
  remoteMeta=cleanPlanMeta(remoteMeta);
  planMeta=cleanPlanMeta(planMeta);
  var dates={},needsPush=[];
  if(changedDateKey)dates[changedDateKey]=true;
  Object.keys(normalisedPlan).forEach(function(k){dates[k]=true;});
  Object.keys(remoteMeta).forEach(function(k){dates[k]=true;});
  if(!changedDateKey){
    Object.keys(plan).forEach(function(k){dates[k]=true;});
    Object.keys(planMeta).forEach(function(k){dates[k]=true;});
  }
  Object.keys(dates).forEach(function(dateKey){
    var remoteKnown=Object.prototype.hasOwnProperty.call(normalisedPlan,dateKey)||Object.prototype.hasOwnProperty.call(remoteMeta,dateKey)||dateKey===changedDateKey;
    var localMeals=plan[dateKey]||[];
    var remoteMeals=normalisedPlan[dateKey]||[];
    var localM=planMeta[dateKey]||{};
    var remoteM=remoteMeta[dateKey]||{};
    var localStamp=parseInt(localM.updatedAt||localM.deletedAt,10)||0;
    var remoteStamp=parseInt(remoteM.updatedAt||remoteM.deletedAt,10)||(remoteKnown?remoteTs:0)||0;
    if(localM.inferred&&remoteKnown&&remoteStamp)localStamp=0;

    if(remoteStamp>localStamp){
      if(remoteM.deletedAt&&!remoteMeals.length)delete plan[dateKey];
      else plan[dateKey]=remoteMeals;
      planMeta[dateKey]=remoteM.updatedAt||remoteM.deletedAt?remoteM:{updatedAt:remoteStamp,clientId:''};
      return;
    }
    if(localStamp>remoteStamp){
      if(remoteKnown)needsPush.push(dateKey);
      return;
    }
    if(remoteKnown){
      var mergedPlan=mergePlanMeals(remoteMeals,localMeals,{},planMealDeletes,dateKey);
      planMealDeletes=Object.assign(planMealDeletes,mergedPlan.deletes);
      if(mergedPlan.items.length){
        plan[dateKey]=mergedPlan.items;
        if(!planMeta[dateKey])planMeta[dateKey]={updatedAt:remoteStamp||Date.now(),clientId:fbClientId};
      }else if((remoteM.deletedAt||localM.deletedAt)&&!mergedPlan.items.length){
        delete plan[dateKey];
        planMeta[dateKey]=remoteM.deletedAt>=localM.deletedAt?remoteM:localM;
      }
      if(!planMealsSame(remoteMeals,mergedPlan.items))needsPush.push(dateKey);
    }
  });
  return needsPush;
}
function buildSharedState(ts){
  return{
    version:2,
    recipes:recipesForState(recipes),
    recipeDeletes:recipeDeletes,
    plan:plan,
    planMeta:planMeta,
    planMealDeletes:planMealDeletes,
    checked:checked,
    extraItems:extraItems,
    stockItems:stockItems.map(normaliseStockItem),
    stockDeletes:stockDeletes,
    stockTemplates:stockTemplates.map(normaliseStockTemplate),
    stockTemplateDeletes:stockTemplateDeletes,
    activityLog:activityLog.map(normaliseActivity).filter(Boolean).slice(0,40),
    newbornChecklist:newbornChecklist.map(normaliseChecklistItem).filter(Boolean),
    collections:collections,
    customMT:customMT,
    ts:ts||Date.now(),
    clientId:fbClientId,
    who:fbCfg.who||'Someone'
  };
}
function saveSharedLocal(){
  saveL('recipes',recipes);
  saveL('recipeDeletes',recipeDeletes);
  saveL('recipeImages',recipeImages);
  saveL('plan',plan);
  saveL('planMeta',planMeta);
  saveL('planMealDeletes',planMealDeletes);
  saveL('checked',checked);
  saveL('extraItems',extraItems);
  saveL('stockItems',stockItems);
  saveL('stockDeletes',stockDeletes);
  saveL('stockTemplates',stockTemplates);
  saveL('stockTemplateDeletes',stockTemplateDeletes);
  saveL('activityLog',activityLog);
  saveL('newbornChecklist',newbornChecklist);
  saveL('collections',collections);
  saveL('customMT',customMT);
}
function encodeFBKey(k){
  return String(k).replace(/[%\.#\$\/\[\]]/g,function(ch){return '%'+ch.charCodeAt(0).toString(16).toUpperCase();});
}
function decodeFBKey(k){
  return String(k).replace(/%([0-9A-Fa-f]{2})/g,function(_,hex){return String.fromCharCode(parseInt(hex,16));});
}
function checkedForState(map){
  var out={};
  if(!map||typeof map!=='object'||Array.isArray(map))return out;
  Object.keys(map).forEach(function(k){out[encodeFBKey(k)]=!!map[k];});
  return out;
}
function checkedFromState(map){
  var out={};
  if(!map||typeof map!=='object'||Array.isArray(map))return out;
  Object.keys(map).forEach(function(k){out[decodeFBKey(k)]=!!map[k];});
  return out;
}
function cleanForFirebase(value){
  if(value===undefined)return undefined;
  if(value===null||typeof value!=='object')return value;
  if(Array.isArray(value)){
    return value.map(function(item){
      var cleaned=cleanForFirebase(item);
      return cleaned===undefined?null:cleaned;
    });
  }
  var out={};
  Object.keys(value).forEach(function(k){
    var cleaned=cleanForFirebase(value[k]);
    if(cleaned!==undefined)out[k]=cleaned;
  });
  return out;
}
function stateForFirebase(state){
  state=state||{};
  state.checked=checkedForState(state.checked);
  return cleanForFirebase(state);
}
function syncErrorMessage(error,prefix){
  var msg=(error&&(error.message||error.code||String(error)))||'unknown error';
  return (prefix||'Sync failed')+': '+msg;
}
function cleanCfgText(v){
  v=String(v||'').trim();
  var md=v.match(/\]\((https?:\/\/[^)]+)\)/);
  if(md)v=md[1];
  v=v.replace(/^['"]|['"]$/g,'').trim();
  return v;
}
function cleanFirebaseURL(v){
  v=cleanCfgText(v).replace(/\/+$/,'');
  return v;
}
function cleanFirebaseKey(v){return cleanCfgText(v);}
function cleanFirebaseWorkspace(v){
  v=cleanCfgText(v).replace(/[.#$\[\]\/\s]+/g,'-').replace(/[^A-Za-z0-9_-]/g,'');
  return v.replace(/^-+|-+$/g,'').slice(0,80);
}
function generateWorkspaceId(){
  var chars='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  var out='mep-';
  if(window.crypto&&window.crypto.getRandomValues){
    var bytes=new Uint8Array(24);
    window.crypto.getRandomValues(bytes);
    for(var i=0;i<bytes.length;i++)out+=chars[bytes[i]%chars.length];
  }else{
    out+=Date.now().toString(36)+Math.random().toString(36).slice(2,18);
  }
  return out;
}
function normaliseFBCfg(cfg){
  if(!cfg)return null;
  return{
    url:cleanFirebaseURL(cfg.url),
    key:cleanFirebaseKey(cfg.key),
    proj:cleanCfgText(cfg.proj),
    who:cleanCfgText(cfg.who),
    vapid:cleanCfgText(cfg.vapid||cfg.vapidKey||cfg.webPushPublicKey),
    workspace:cleanFirebaseWorkspace(cfg.workspace||cfg.space||cfg.syncId||'')
  };
}
function ensureFBCfgWorkspace(cfg){
  if(!cfg)return null;
  if(!cfg.workspace)cfg.workspace=generateWorkspaceId();
  return cfg;
}
function publishRecipeImages(){
  if(!fbConn||!fbRef)return;
  recipeImages=Object.assign({},recipeImages,recipeImagesFrom(recipes));
  if(Object.keys(recipeImages).length)fbRef.child('recipeImages').update(cleanForFirebase(recipeImages));
  saveL('recipeImages',recipeImages);
}
function applyRecipeImages(imgs){
  imgs=imgs&&typeof imgs==='object'&&!Array.isArray(imgs)?imgs:{};
  recipeImages=imgs;
  recipes=attachRecipeImages(recipes,false);
  saveL('recipeImages',recipeImages);
  saveL('recipes',recipes);
  renderAll();
}
function loadRemoteRecipeImages(){
  if(!fbConn||!fbRef)return;
  fbRef.child('recipeImages').once('value').then(function(snap){
    if(!snap.exists())return;
    applyRecipeImages(snap.val());
  }).catch(function(){});
}
function registerAppServiceWorker(){
  if(!('serviceWorker' in navigator))return Promise.resolve(null);
  return navigator.serviceWorker.register('sw.js',{scope:'./'}).catch(function(){return null;});
}
function applySharedState(state,force){
  if(!state||typeof state!=='object')return false;
  if(!force&&fbStateLoaded&&state.clientId===fbClientId)return false;
  if(!force&&pendingSharedWrites>0&&state.clientId!==fbClientId)return false;
  if(!force&&loadL('sharedDirty')&&state.clientId!==fbClientId)return false;
  var shouldCheckStockAlerts=fbStateLoaded&&state.clientId!==fbClientId;
  recipes=attachRecipeImages(normaliseIds({recipes:Array.isArray(state.recipes)?state.recipes:[],plan:{}}).recipes);
  recipeDeletes=normaliseStampMap(state.recipeDeletes);
  plan=normalisePlanObject((state.plan&&typeof state.plan==='object'&&!Array.isArray(state.plan))?state.plan:{});
  planMeta=cleanPlanMeta(state.planMeta);
  planMealDeletes=normaliseStampMap(state.planMealDeletes);
  checked=checkedFromState(state.checked);
  extraItems=Array.isArray(state.extraItems)?state.extraItems:extraItems;
  stockItems=Array.isArray(state.stockItems)?state.stockItems.map(normaliseStockItem):stockItems;
  stockDeletes=normaliseStampMap(state.stockDeletes);
  var appliedTemplates=mergeStockTemplateLists(Array.isArray(state.stockTemplates)?state.stockTemplates:stockTemplates,[],normaliseStampMap(state.stockTemplateDeletes),{});
  stockTemplates=appliedTemplates.items;
  stockTemplateDeletes=appliedTemplates.deleted;
  ensureDefaultStockTemplates();
  activityLog=Array.isArray(state.activityLog)?mergeActivityLogs(activityLog,state.activityLog):activityLog;
  newbornChecklist=Array.isArray(state.newbornChecklist)?mergeChecklist(newbornChecklist,state.newbornChecklist):newbornChecklist;
  collections=Array.isArray(state.collections)?state.collections:collections;
  customMT=Array.isArray(state.customMT)?state.customMT:customMT;
  refreshMT();
  saveSharedLocal();
  if(state.clientId!==fbClientId)loadRemoteRecipeImages();
  if(state.ts)saveL('sharedStateTs',state.ts);
  fbStateLoaded=true;
  renderAll();
  if(state.who&&state.clientId!==fbClientId)showToast(state.who+' updated planner');
  if(shouldCheckStockAlerts)checkAllStockAlerts();
  return true;
}
function normaliseSharedState(state){
  state=state&&typeof state==='object'?state:{};
  return{
    version:2,
    recipes:normaliseIds({recipes:Array.isArray(state.recipes)?state.recipes:[],plan:{}}).recipes,
    recipeDeletes:normaliseStampMap(state.recipeDeletes),
    plan:normalisePlanObject((state.plan&&typeof state.plan==='object'&&!Array.isArray(state.plan))?state.plan:{}),
    planMeta:cleanPlanMeta(state.planMeta),
    planMealDeletes:normaliseStampMap(state.planMealDeletes),
    checked:checkedFromState(state.checked),
    extraItems:Array.isArray(state.extraItems)?state.extraItems:[],
    stockItems:Array.isArray(state.stockItems)?state.stockItems.map(normaliseStockItem):[],
    stockDeletes:normaliseStampMap(state.stockDeletes),
    stockTemplates:Array.isArray(state.stockTemplates)?state.stockTemplates.map(normaliseStockTemplate):[],
    stockTemplateDeletes:normaliseStampMap(state.stockTemplateDeletes),
    activityLog:Array.isArray(state.activityLog)?state.activityLog.map(normaliseActivity).filter(Boolean):[],
    newbornChecklist:Array.isArray(state.newbornChecklist)?state.newbornChecklist.map(normaliseChecklistItem).filter(Boolean):[],
    collections:Array.isArray(state.collections)?state.collections:[],
    customMT:Array.isArray(state.customMT)?state.customMT:[],
    ts:parseInt(state.ts,10)||0,
    clientId:state.clientId||'',
    who:state.who||''
  };
}
function mergeListById(remoteItems, localItems){
  var out=[],byId={},order=[];
  function idFor(item){return item&&item.id!==undefined&&item.id!==null?String(item.id):JSON.stringify(item);}
  function add(item){var id=idFor(item);if(!byId[id])order.push(id);byId[id]=item;}
  (Array.isArray(remoteItems)?remoteItems:[]).forEach(add);
  (Array.isArray(localItems)?localItems:[]).forEach(add);
  order.forEach(function(id){out.push(byId[id]);});
  return out;
}
function mergeActivityLogs(a,b){
  var merged=mergeListById(a,b).map(normaliseActivity).filter(Boolean);
  merged.sort(function(x,y){return y.ts-x.ts;});
  return merged.slice(0,40);
}
function mergeChecklist(a,b){
  var byId={},order=[];
  function add(item){
    item=normaliseChecklistItem(item);if(!item)return;
    var id=String(item.id);if(!byId[id])order.push(id);
    if(!byId[id]||item.updatedAt>=byId[id].updatedAt)byId[id]=item;
  }
  (Array.isArray(a)?a:[]).forEach(add);(Array.isArray(b)?b:[]).forEach(add);
  return order.map(function(id){return byId[id];}).filter(Boolean).sort(function(x,y){return x.order-y.order||x.text.localeCompare(y.text);});
}
function mergeSimpleList(remoteItems,localItems){
  var out=[],seen={};
  (Array.isArray(remoteItems)?remoteItems:[]).concat(Array.isArray(localItems)?localItems:[]).forEach(function(item){
    var key=JSON.stringify(item);
    if(!seen[key]){seen[key]=true;out.push(item);}
  });
  return out;
}
function mergeAllPlans(remote,local,ts){
  var outPlan={},outMeta={},outDeletes=Object.assign({},remote.planMealDeletes);
  Object.keys(local.planMealDeletes).forEach(function(id){
    outDeletes[id]=Math.max(outDeletes[id]||0,local.planMealDeletes[id]);
  });
  var dates={};
  [remote.plan,local.plan,remote.planMeta,local.planMeta].forEach(function(src){
    Object.keys(src||{}).forEach(function(k){dates[k]=true;});
  });
  Object.keys(dates).forEach(function(dateKey){
    var mergedPlan=mergePlanMeals(remote.plan[dateKey]||[],local.plan[dateKey]||[],remote.planMealDeletes,local.planMealDeletes,dateKey);
    outDeletes=Object.assign(outDeletes,mergedPlan.deletes);
    var rm=remote.planMeta[dateKey]||{},lm=local.planMeta[dateKey]||{};
    var rts=parseInt(rm.updatedAt||rm.deletedAt,10)||0;
    var lts=parseInt(lm.updatedAt||lm.deletedAt,10)||0;
    var chosen=lts>=rts?lm:rm;
    if(mergedPlan.items.length){
      outPlan[dateKey]=mergedPlan.items;
      outMeta[dateKey]={updatedAt:Math.max(rts,lts,ts||0),deletedAt:0,clientId:fbClientId};
    }else if((rm.deletedAt||lm.deletedAt)&&!mergedPlan.items.length){
      outMeta[dateKey]=chosen;
    }
  });
  return{plan:outPlan,meta:outMeta,deletes:outDeletes};
}
function mergeWholeSharedState(remote,local,ts){
  var out=normaliseSharedState(remote);
  var mergedRecipes=mergeRecipeLists(remote.recipes,local.recipes,remote.ts,ts,remote.recipeDeletes,local.recipeDeletes);
  var mergedStock=mergeStockLists(local.stockItems,remote.stockItems,local.stockDeletes,remote.stockDeletes);
  var mergedTemplates=mergeStockTemplateLists(local.stockTemplates,remote.stockTemplates,local.stockTemplateDeletes,remote.stockTemplateDeletes);
  var mergedPlan=mergeAllPlans(remote,local,ts);
  out.recipes=mergedRecipes.items;
  out.recipeDeletes=mergedRecipes.deleted;
  out.plan=mergedPlan.plan;
  out.planMeta=mergedPlan.meta;
  out.planMealDeletes=mergedPlan.deletes;
  out.checked=Object.assign({},remote.checked,local.checked);
  out.extraItems=mergeSimpleList(remote.extraItems,local.extraItems);
  out.stockItems=mergedStock.items;
  out.stockDeletes=mergedStock.deleted;
  out.stockTemplates=mergedTemplates.items;
  out.stockTemplateDeletes=mergedTemplates.deleted;
  out.activityLog=mergeActivityLogs(remote.activityLog,local.activityLog);
  out.newbornChecklist=mergeChecklist(remote.newbornChecklist,local.newbornChecklist);
  out.collections=mergeListById(remote.collections,local.collections);
  out.customMT=mergeSimpleList(remote.customMT,local.customMT);
  out.version=2;out.ts=ts;out.clientId=fbClientId;out.who=fbCfg.who||'Someone';
  return stateForFirebase(out);
}
function mergeSharedState(remote, local, changedKey, changedDateKey, ts){
  remote=normaliseSharedState(remote);
  local=normaliseSharedState(local);
  if(!changedKey){
    return mergeWholeSharedState(remote,local,ts);
  }
  var out=normaliseSharedState(remote);
  if(!out.extraItems.length&&local.extraItems.length)out.extraItems=local.extraItems;
  out.activityLog=mergeActivityLogs(remote.activityLog,local.activityLog);
  out.newbornChecklist=mergeChecklist(remote.newbornChecklist,local.newbornChecklist);
  if(!out.collections.length&&local.collections.length)out.collections=local.collections;
  if(!out.customMT.length&&local.customMT.length)out.customMT=local.customMT;
  var mergedRecipes=mergeRecipeLists(remote.recipes,local.recipes,remote.ts,ts,remote.recipeDeletes,local.recipeDeletes);
  var mergedStock=mergeStockLists(local.stockItems,remote.stockItems,local.stockDeletes,remote.stockDeletes);
  var mergedTemplates=mergeStockTemplateLists(local.stockTemplates,remote.stockTemplates,local.stockTemplateDeletes,remote.stockTemplateDeletes);
  out.recipes=mergedRecipes.items;
  out.recipeDeletes=mergedRecipes.deleted;
  out.stockTemplates=mergedTemplates.items;
  out.stockTemplateDeletes=mergedTemplates.deleted;
  out.planMealDeletes=Object.assign({},remote.planMealDeletes);
  Object.keys(local.planMealDeletes).forEach(function(id){
    out.planMealDeletes[id]=Math.max(out.planMealDeletes[id]||0,local.planMealDeletes[id]);
  });

  if(changedKey==='plan'&&changedDateKey){
    out.plan=remote.plan;out.planMeta=remote.planMeta;
    var remoteMeals=remote.plan[changedDateKey]||[];
    var localMeals=local.plan[changedDateKey]||[];
    var localMeta=local.planMeta[changedDateKey]||{updatedAt:ts,clientId:fbClientId};
    var mergedPlan=mergePlanMeals(remoteMeals,localMeals,remote.planMealDeletes,local.planMealDeletes,changedDateKey);
    out.planMealDeletes=Object.assign(out.planMealDeletes,mergedPlan.deletes);
    if(localMeta.deletedAt&&!mergedPlan.items.length){
      delete out.plan[changedDateKey];
    }else{
      out.plan[changedDateKey]=mergedPlan.items;
    }
    out.planMeta[changedDateKey]={updatedAt:ts,deletedAt:localMeta.deletedAt&&!mergedPlan.items.length?ts:0,clientId:fbClientId};
  }else if(changedKey==='plan'){
    out.plan=local.plan;out.planMeta=local.planMeta;
    out.planMealDeletes=local.planMealDeletes;
  }else{
    out.plan=remote.plan;out.planMeta=remote.planMeta;
  }

  if(changedKey==='checked'){
    if(changedDateKey==='__clear__')out.checked=local.checked;
    else if(changedDateKey){
      out.checked=remote.checked;
      out.checked[changedDateKey]=local.checked[changedDateKey];
    }else out.checked=local.checked;
  }
  if(changedKey==='extraItems'){
    var exOp=changedDateKey||{};
    var mergedExtras=mergeSimpleList(remote.extraItems,local.extraItems);
    if(exOp.type==='add')out.extraItems=mergedExtras;
    else if(exOp.type==='remove')out.extraItems=mergedExtras.filter(function(item){return item!==exOp.item;});
    else out.extraItems=local.extraItems;
  }
  if(changedKey==='stockItems'){
    var stOp=changedDateKey||{};
    out.stockItems=mergedStock.items;
    out.stockDeletes=mergedStock.deleted;
    out.stockTemplates=mergedTemplates.items;
    out.stockTemplateDeletes=mergedTemplates.deleted;
    if(stOp.type==='remove'&&stOp.id)out.stockDeletes[String(stOp.id)]=Math.max(out.stockDeletes[String(stOp.id)]||0,stOp.deletedAt||ts);
  }
  if(changedKey==='stockTemplates'){
    var tplOp=changedDateKey||{};
    out.stockTemplates=mergedTemplates.items;
    out.stockTemplateDeletes=mergedTemplates.deleted;
    if(tplOp.type==='remove'&&tplOp.id)out.stockTemplateDeletes[String(tplOp.id)]=Math.max(out.stockTemplateDeletes[String(tplOp.id)]||0,tplOp.deletedAt||ts);
  }
  if(changedKey==='newbornChecklist')out.newbornChecklist=mergeChecklist(remote.newbornChecklist,local.newbornChecklist);
  if(changedKey==='collections'){
    var collOp=changedDateKey||{};
    if(collOp.type==='add')out.collections=mergeListById(remote.collections,[collOp.item]);
    else if(collOp.type==='remove')out.collections=remote.collections.filter(function(c){return String(c.id)!==String(collOp.id);});
    else if(collOp.type==='update')out.collections=mergeListById(remote.collections,[collOp.item]);
    else out.collections=mergeListById(remote.collections,local.collections);
  }
  if(changedKey==='customMT'){
    var mtOp=changedDateKey||{};
    if(mtOp.type==='add')out.customMT=mergeSimpleList(remote.customMT,[mtOp.item]);
    else if(mtOp.type==='remove')out.customMT=remote.customMT.filter(function(item){return item!==mtOp.item;});
    else out.customMT=mergeSimpleList(remote.customMT,local.customMT);
  }
  if(changedKey==='recipes'){out.recipes=mergedRecipes.items;out.recipeDeletes=mergedRecipes.deleted;}
  out.version=2;out.ts=ts;out.clientId=fbClientId;out.who=fbCfg.who||'Someone';
  return stateForFirebase(out);
}
function finishSharedWrite(error){
  pendingSharedWrites=Math.max(0,pendingSharedWrites-1);
  if(error){
    var msg=syncErrorMessage(error,'Sync failed');
    var st=gr('sync-txt');if(st)st.textContent=msg;
    showToast(msg);
    return false;
  }
  if(pendingSharedWrites===0)saveL('sharedDirty',0);
  return true;
}
function publishPlanDateState(local,dateKey,ts){
  var localMeals=normalisePlanObject((function(){var p={};p[dateKey]=local.plan[dateKey]||[];return p;})())[dateKey]||[];
  return fbRef.child('state/plan').child(dateKey).transaction(function(remoteMeals){
    var merged=cleanForFirebase(mergePlanMeals(remoteMeals||[],localMeals,{},local.planMealDeletes,dateKey).items);
    return merged.length?merged:null;
  }).then(function(result){
    var mergedMeals=result&&result.snapshot?result.snapshot.val():null;
    if(mergedMeals&&mergedMeals.length)plan[dateKey]=normalisePlanObject((function(){var p={};p[dateKey]=mergedMeals;return p;})())[dateKey];
    else delete plan[dateKey];
    var updates={version:2,ts:ts,clientId:fbClientId,who:fbCfg.who||'Someone'};
    planMeta[dateKey]=cleanForFirebase(local.planMeta[dateKey]||{updatedAt:ts,clientId:fbClientId});
    updates['planMeta/'+dateKey]=planMeta[dateKey];
    Object.keys(local.planMealDeletes).forEach(function(id){updates['planMealDeletes/'+id]=local.planMealDeletes[id];});
    saveL('plan',plan);saveL('planMeta',planMeta);saveL('planMealDeletes',planMealDeletes);
    return fbRef.child('state').update(cleanForFirebase(updates));
  }).then(function(){
    finishSharedWrite();
  }).catch(function(error){
    finishSharedWrite(error);
  });
}
function publishRecipeState(local,ts){
  publishRecipeImages();
  return fbRef.child('state/recipes').transaction(function(remoteRecipes){
    return cleanForFirebase(mergeRecipeLists(local.recipes,Array.isArray(remoteRecipes)?remoteRecipes:[],ts,0,local.recipeDeletes,{}).items);
  }).then(function(result){
    var mergedRecipes=result&&result.snapshot&&Array.isArray(result.snapshot.val())?result.snapshot.val():local.recipes;
    recipes=attachRecipeImages(normaliseIds({recipes:mergedRecipes,plan:{}}).recipes);
    recipeDeletes=normaliseStampMap(local.recipeDeletes);
    var updates={version:2,ts:ts,clientId:fbClientId,who:fbCfg.who||'Someone'};
    Object.keys(local.recipeDeletes).forEach(function(id){updates['recipeDeletes/'+id]=local.recipeDeletes[id];});
    saveL('recipes',recipes);saveL('recipeDeletes',recipeDeletes);saveL('recipeImages',recipeImages);
    return fbRef.child('state').update(cleanForFirebase(updates));
  }).then(function(){
    finishSharedWrite();
  }).catch(function(error){
    finishSharedWrite(error);
  });
}
function publishSharedState(changedKey,changedDateKey){
  if(!fbConn||!fbRef)return;
  var ts=Date.now();
  saveL('sharedDirty',ts);
  var local=buildSharedState(ts);
  lastLocalPush.state=ts;
  fbStateLoaded=true;
  pendingSharedWrites++;
  if(changedKey==='plan'&&changedDateKey){publishPlanDateState(local,changedDateKey,ts);return;}
  if(changedKey==='recipes'){publishRecipeState(local,ts);return;}
  fbRef.child('state').transaction(function(remote){
    return mergeSharedState(remote,local,changedKey,changedDateKey,ts);
  },function(error,committed,snap){
    if(!finishSharedWrite(error))return;
    if(committed&&snap&&snap.val())applySharedState(snap.val(),true);
  });
}
function bootstrapSharedState(){
  if(!fbConn||!fbRef||fbBootstrappingState)return Promise.resolve(false);
  fbBootstrappingState=true;
  return Promise.all(['recipes','plan','checked'].map(function(key){
    return fbRef.child(key).once('value').then(function(snap){return{key:key,val:snap.val()};});
  })).then(function(rows){
    rows.forEach(function(row){
      if(row.val===null||row.val===undefined)return;
      var d=row.val||{};
      var wrapped=d&&typeof d==='object'&&(Object.prototype.hasOwnProperty.call(d,'items')||Object.prototype.hasOwnProperty.call(d,'ts'));
      var items=wrapped?d.items:d;
      if(row.key==='recipes'){
        if(Array.isArray(items)&&items.length)recipes=attachRecipeImages(normaliseIds({recipes:items,plan:{}}).recipes);
        if(d&&Object.prototype.hasOwnProperty.call(d,'deleted'))recipeDeletes=normaliseStampMap(d.deleted);
      }else if(row.key==='plan'){
        if(items&&typeof items==='object'&&!Array.isArray(items)&&Object.keys(items).length)plan=normaliseIds({recipes:[],plan:items}).plan;
        if(d&&Object.prototype.hasOwnProperty.call(d,'meta'))planMeta=cleanPlanMeta(d.meta);
      }else if(row.key==='checked'){
        if(items&&typeof items==='object'&&!Array.isArray(items))checked=checkedFromState(items);
      }
    });
    migrateLegacyPlan(loadL('currentWeekStartDate')||currentWeekStartKey());
    saveSharedLocal();
    publishSharedState();
    publishRecipeImages();
    renderAll();
    return true;
  }).finally(function(){
    fbBootstrappingState=false;
  });
}

// FIREBASE
function openFBSetup(){var c=ensureFBCfgWorkspace(normaliseFBCfg(loadL('fbCfg')))||{url:'',key:'',proj:'',who:'',workspace:generateWorkspaceId(),vapid:''};fbCfg=c;gr('fb-url').value=c.url||'';gr('fb-key').value=c.key||'';gr('fb-proj').value=c.proj||'';gr('fb-workspace').value=c.workspace||'';gr('fb-who').value=c.who||'';if(gr('fb-vapid'))gr('fb-vapid').value=c.vapid||'';openM('modal-fb');}
function connectFB(){
  var cfg=ensureFBCfgWorkspace(normaliseFBCfg({url:gr('fb-url').value,key:gr('fb-key').value,proj:gr('fb-proj').value,workspace:gr('fb-workspace').value,who:gr('fb-who').value,vapid:gr('fb-vapid')?gr('fb-vapid').value:''}));
  var url=cfg.url,key=cfg.key,proj=cfg.proj,workspace=cfg.workspace,who=cfg.who,vapid=cfg.vapid;
  if(!url||!key||!proj||!workspace){gr('fb-status').innerHTML='<span style="color:var(--red)">Please fill in Database URL, API Key, Project ID and workspace ID</span>';return;}
  fbCfg={url,key,proj,workspace,who,vapid};gr('fb-workspace').value=workspace;saveL('fbCfg',fbCfg);
  gr('fb-status').innerHTML='<span style="color:var(--sage)">Connecting...</span>';
  loadFBSDK().then(function(){return initFB();}).then(function(ok){
    if(!ok)gr('fb-status').innerHTML='<span style="color:var(--red)">Connection failed - check your config values and enable Anonymous Auth</span>';
  }).catch(function(){gr('fb-status').innerHTML='<span style="color:var(--red)">Connection failed - check your config values and enable Anonymous Auth</span>';});
}
function loadFBSDK(){
  function loadScript(src){
    return new Promise(function(res,rej){
      var s=document.createElement('script');
      s.src=src;s.onload=res;s.onerror=rej;document.head.appendChild(s);
    });
  }
  var ready=Promise.resolve();
  if(!window.firebase)ready=ready.then(function(){return loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');});
  ready=ready.then(function(){
    if(!firebase.database)return loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js');
  });
  ready=ready.then(function(){
    if(!firebase.auth)return loadScript('https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js');
  });
  return ready;
}
function ensureFirebaseSignedIn(){
  if(!firebase.auth)return Promise.resolve(true);
  var auth=firebase.auth();
  if(auth.currentUser)return Promise.resolve(auth.currentUser);
  return auth.signInAnonymously();
}
function urlBase64ToUint8Array(base64String){
  var padding='='.repeat((4-base64String.length%4)%4);
  var base64=(base64String+padding).replace(/-/g,'+').replace(/_/g,'/');
  var raw=window.atob(base64);
  var out=new Uint8Array(raw.length);
  for(var i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);
  return out;
}
function supportsClosedNotifications(){
  return 'Notification' in window&&'serviceWorker' in navigator&&'PushManager' in window;
}
function setupClosedStockNotifications(silent){
  if(!supportsClosedNotifications()){if(!silent)showToast('Closed notifications are not supported in this browser');return Promise.resolve(false);}
  if(!fbConn||!fbRef){if(!silent)showToast('Connect sync first');return Promise.resolve(false);}
  if(!fbCfg.vapid){if(!silent)showToast('Add the Web Push public key in sync setup');return Promise.resolve(false);}
  if(silent&&Notification.permission!=='granted')return Promise.resolve(false);
  return requestStockNotificationPermission().then(function(ok){
    if(!ok){if(!silent)showToast('Notifications are blocked');return false;}
    return registerAppServiceWorker().then(function(reg){
      if(!reg){if(!silent)showToast('Could not register notifications');return false;}
      return reg.pushManager.getSubscription().then(function(existing){
        return existing||reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlBase64ToUint8Array(fbCfg.vapid)});
      }).then(function(sub){
        var key='sub-'+simpleHash(sub.endpoint);
        var data={subscription:sub.toJSON(),clientId:fbClientId,who:fbCfg.who||'',updatedAt:Date.now()};
        return fbRef.child('pushSubscriptions').child(encodeFBKey(key)).set(cleanForFirebase(data)).then(function(){
          saveL('pushSubscriptionKey',key);
          if(!silent)showToast('Closed-app stock alerts enabled');
          return true;
        });
      });
    });
  }).catch(function(error){
    if(!silent)showToast(syncErrorMessage(error,'Notification setup failed'));
    return false;
  });
}
function isOwnEcho(key,d){
  if(!d)return false;
  if(d.clientId)return d.clientId===fbClientId;
  return d.ts&&d.ts===lastLocalPush[key];
}
function applyRemoteData(key,d,force){
  if(!d||(!force&&isOwnEcho(key,d)))return;
  var wrapped=Object.prototype.hasOwnProperty.call(d,'ts')||Object.prototype.hasOwnProperty.call(d,'who');
  var items=wrapped?d.items:d;
  if(key==='recipes'){
    var localRecipesTs=loadL('recipesTs')||0;
    var remoteRecipesTs=wrapped&&d.ts?d.ts:0;
    var recipeItems=Array.isArray(items)?items:[];
    var mergedRecipes=mergeRecipeLists(recipes,recipeItems,localRecipesTs,remoteRecipesTs,recipeDeletes,d.deleted);
    recipes=normaliseIds({recipes:mergedRecipes.items,plan:{}}).recipes;
    recipeDeletes=mergedRecipes.deleted;
    saveL('recipes',recipes);
    saveL('recipeDeletes',recipeDeletes);
    var mergedRecipesTs=Math.max(localRecipesTs,remoteRecipesTs)||Date.now();
    if(mergedRecipes.needsPush)mergedRecipesTs=Date.now();
    saveL('recipesTs',mergedRecipesTs);
    if(mergedRecipes.needsPush)pushRecipes(mergedRecipesTs);
 }else if(key==='plan'){
  var planItems = items && typeof items === 'object' && !Array.isArray(items)
    ? items
    : {};

  var needsPlanPush=mergeRemotePlan(planItems,d.meta||{},fbPlanLoaded?d.changedDateKey:null,wrapped&&d.ts?d.ts:0);
  fbPlanLoaded = true;

  migrateLegacyPlan(loadL('currentWeekStartDate')||currentWeekStartKey());
  saveL('plan', plan);
  saveL('planMeta',planMeta);
  needsPlanPush.forEach(function(dateKey){pushPlan(dateKey);});
  }else if(key==='checked'){
    checked=items&&typeof items==='object'&&!Array.isArray(items)?checkedFromState(items):{};
    saveL('checked',checked);
  }
  renderAll();
  if(d.who)showToast(d.who+' updated '+key);
}
function listenForRemoteData(key){
  var childRef=fbRef.child(key);
  childRef.off('value');
  childRef.on('value',function(snap){
    applyRemoteData(key,snap.val());
  });
}
function listenForSharedState(){
  var stateRef=fbRef.child('state');
  stateRef.off('value');
  stateRef.on('value',function(snap){
    var state=snap.val();
    if(state)applySharedState(state,false);
    else bootstrapSharedState();
  });
}
function listenForRecipeImages(){
  var imgRef=fbRef.child('recipeImages');
  imgRef.off('value');
  imgRef.on('value',function(snap){
    if(!snap.exists())return;
    applyRecipeImages(snap.val());
  });
}
function initFB(){
  try{
    fbCfg=ensureFBCfgWorkspace(normaliseFBCfg(fbCfg));
    if(!fbCfg||!fbCfg.url||!fbCfg.key||!fbCfg.proj||!fbCfg.workspace)throw new Error('Missing Firebase config');
    saveL('fbCfg',fbCfg);
    if(!firebase.apps.length)firebase.initializeApp({apiKey:fbCfg.key,databaseURL:fbCfg.url,projectId:fbCfg.proj});
    return ensureFirebaseSignedIn().then(function(){
      fbRef=firebase.database().ref('mep').child(fbCfg.workspace);fbConn=true;
      fbPlanLoaded = false;
      listenForSharedState();
      listenForRecipeImages();
      if(loadL('sharedDirty'))setTimeout(function(){publishSharedState();},600);
      if(fbCfg.vapid)setupClosedStockNotifications(true);
      gr('sync-bar').className='sync-bar';gr('sync-txt').textContent='Live sync active'+(fbCfg.who?' — '+fbCfg.who+"'s planner":'');
      gr('fb-status').innerHTML='<span style="color:var(--sage)">✓ Connected!</span>';
      setTimeout(function(){closeM('modal-fb');},1200);
      return true;
    }).catch(function(){
      fbConn=false;fbRef=null;
      gr('sync-bar').className='sync-bar off';
      gr('sync-txt').textContent='Sync auth error';
      return false;
    });
  } catch(e) {
    gr('sync-bar').className = 'sync-bar off';
    gr('sync-txt').textContent = 'Sync error';
    return Promise.resolve(false);
  }
}
function ensureFBReady(){
  if(fbConn&&fbRef)return Promise.resolve(true);
  var cfg=ensureFBCfgWorkspace(normaliseFBCfg(loadL('fbCfg')));
  if(!cfg||!cfg.url||!cfg.key||!cfg.proj||!cfg.workspace){
    showToast('Connect sync first');
    openFBSetup();
    return Promise.resolve(false);
  }
  fbCfg=cfg;
  return loadFBSDK().then(function(){
    return initFB();
  }).then(function(){
    return !!fbRef;
  }).catch(function(){
    gr('sync-bar').className='sync-bar off';
    gr('sync-txt').textContent='Sync error';
    showToast('Could not connect to sync');
    return false;
  });
}
function refreshSyncNow(){
  var btn=gr('refresh-sync-btn');
  if(btn){btn.disabled=true;btn.textContent='Refreshing...';}
  ensureFBReady().then(function(ok){
    if(!ok)return;
    var ts=Date.now();
    var local=buildSharedState(ts);
    publishRecipeImages();
    return fbRef.child('state').transaction(function(remote){
      return mergeSharedState(remote,local,null,null,ts);
    }).then(function(result){
      if(result&&result.committed&&result.snapshot&&result.snapshot.val())applySharedState(result.snapshot.val(),true);
      saveL('sharedDirty',0);
    }).then(function(){
      renderAll();
      gr('sync-bar').className='sync-bar';
      gr('sync-txt').textContent='Live sync active'+(fbCfg.who?' - '+fbCfg.who+"'s planner":'');
      showToast('Planner refreshed');
    });
  }).catch(function(error){
    gr('sync-bar').className='sync-bar off';
    var msg=syncErrorMessage(error,'Refresh failed');
    gr('sync-txt').textContent=msg;
    showToast(msg);
  }).finally(function(){
    if(btn){btn.disabled=false;btn.innerHTML='&#8635; Refresh';}
  });
}

var lastLocalPush={
  state: 0,
  recipes: 0,
  plan: 0,
  checked: 0
};
function pushRecipes(ts){
  if(!fbConn||!fbRef)return;
  var recipesTs=ts||loadL('recipesTs')||Date.now();
  saveL('recipesTs',recipesTs);
  lastLocalPush.recipes = recipesTs;
  //Save recipes
fbRef.child("recipes").set(cleanForFirebase({
  items: recipesForState(recipes),
  deleted: recipeDeletes,
  who:fbCfg.who ||"Someone",
  ts: recipesTs,
  clientId:fbClientId
  }));
}

function pushPlan(dateKey) {
  if (!fbConn || !fbRef || !dateKey) return;

  lastLocalPush.plan = Date.now();
  if(!planMeta[dateKey])touchPlanDate(dateKey,lastLocalPush.plan);
  var cleanedDatePlan=normalisePlanObject((function(){var p={};p[dateKey]=plan[dateKey]||[];return p;})());
  plan[dateKey]=cleanedDatePlan[dateKey]||[];
  planMeta[dateKey]=cleanForFirebase(planMeta[dateKey]||{updatedAt:lastLocalPush.plan,clientId:fbClientId});

  var updates = {};
  updates['items/' + dateKey] = plan[dateKey]&&plan[dateKey].length ? cleanForFirebase(plan[dateKey]) : null;
  updates['meta/' + dateKey] = planMeta[dateKey];
  updates.who = fbCfg.who || 'Someone';
  updates.ts = lastLocalPush.plan;
  updates.clientId = fbClientId;
  updates.changedDateKey = dateKey;

  fbRef.child('plan').update(cleanForFirebase(updates));
}
  function pushChecked() {
    if(!fbConn || !fbRef) return;

    lastLocalPush.checked=Date.now();

    fbRef.child ("checked").set(cleanForFirebase({
      items:checkedForState(checked),
      who:fbCfg.who || "Someone",
      ts:lastLocalPush.checked,
      clientId:fbClientId
    }));
  }

function push(changedKey, changedDateKey) {
  var sharedKeys=['recipes','plan','checked','extraItems','stockItems','stockTemplates','newbornChecklist','collections','customMT'];
  if(sharedKeys.indexOf(changedKey)<0)return;
  if(fbConn&&fbRef){publishSharedState(changedKey,changedDateKey);return;}
  saveL('sharedDirty',Date.now());
  ensureFBReady().then(function(ok){
    if(ok)publishSharedState(changedKey,changedDateKey);
  });
}

// PERSIST
function saveL(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
function loadL(k){try{var v=localStorage.getItem(k);return v?JSON.parse(v):null;}catch(e){return null;}}
function persist(changedKey, changedDateKey){
  var sharedKeys=['recipes','plan','checked','extraItems','stockItems','stockTemplates','newbornChecklist','collections','customMT'];
  if(sharedKeys.indexOf(changedKey)>=0)saveL('sharedDirty',Date.now());
  if(changedKey==='plan')addActivity('Updated meal plan',changedDateKey||'Planner changed','planner');
  if(changedKey==='recipes')saveL('recipesTs',Date.now());
  if(changedKey==='plan'&&changedDateKey)touchPlanDate(changedDateKey);
  if(changedKey==='recipes')recipeImages=recipeImagesFrom(recipes);
  if(changedKey==='plan'){
    if(changedDateKey){
      var cleaned=normalisePlanObject((function(){var p={};p[changedDateKey]=plan[changedDateKey]||[];return p;})());
      if(cleaned[changedDateKey]&&cleaned[changedDateKey].length)plan[changedDateKey]=cleaned[changedDateKey];
      else delete plan[changedDateKey];
    }else{
      plan=normalisePlanObject(plan);
    }
    planMeta=cleanPlanMeta(planMeta);
  }
  saveL('recipes',recipes);
  saveL('recipeDeletes',recipeDeletes);
  saveL('recipeImages',recipeImages);
  saveL('plan',plan);
  saveL('planMeta',planMeta);
  saveL('planMealDeletes',planMealDeletes);
  saveL('checked',checked);
  saveL('extraItems',extraItems);
  saveL('stockItems',stockItems);
  saveL('stockDeletes',stockDeletes);
  saveL('stockTemplates',stockTemplates);
  saveL('stockTemplateDeletes',stockTemplateDeletes);
  saveL('activityLog',activityLog);
  saveL('newbornChecklist',newbornChecklist);
  saveL('aisleOrder',aisleOrder);
  saveL('collections',collections);
  saveL('customMT',customMT);
  saveL('darkMode',darkMode);
  saveL('profile',{
    userAllergens:userAllergens,
    userDiet:userDiet,
    weekStart:weekStart,
    userSupermarket:userSupermarket,
    userAppliances:userAppliances
  });
  saveL ('planTs',Date.now());
  push(changedKey, changedDateKey);
}
function normaliseRecipe(r){
  if(!r||typeof r!=='object')return r;
  r.id=parseInt(r.id,10)||r.id;
  r.diets=Array.isArray(r.diets)?r.diets:[];
  r.allergens=Array.isArray(r.allergens)?r.allergens:[];
  r.appliances=Array.isArray(r.appliances)?r.appliances:[];
  r.ingredients=Array.isArray(r.ingredients)?r.ingredients:[];
  r.steps=Array.isArray(r.steps)?r.steps:[];
  if(r.updatedAt)r.updatedAt=parseInt(r.updatedAt,10)||0;
  if(r.lastCooked)r.lastCooked=parseInt(r.lastCooked,10)||0;
  return r;
}
function normaliseIds(data){
  if(data.recipes){data.recipes=data.recipes.map(normaliseRecipe);}
  if(data.plan){data.plan=normalisePlanObject(data.plan);}
  return data;
}
function loadPersisted(){
  var r=loadL('recipes');if(r&&r.length){var nd=normaliseIds({recipes:r,plan:{}});recipes=nd.recipes;}
  var ri=loadL('recipeImages');if(ri&&typeof ri==='object'&&!Array.isArray(ri))recipeImages=ri;
  recipes=attachRecipeImages(recipes);
  var rd=loadL('recipeDeletes');if(rd)recipeDeletes=normaliseStampMap(rd);
  var p=loadL('plan');if(p){var nd2=normaliseIds({recipes:[],plan:p});plan=nd2.plan;}
  var pm=loadL('planMeta');if(pm)planMeta=cleanPlanMeta(pm);
  var pmd=loadL('planMealDeletes');if(pmd)planMealDeletes=normaliseStampMap(pmd);
  var oldPlanTs=loadL('planTs')||0;
  Object.keys(plan).forEach(function(k){
    if(/^\d{4}-\d{2}-\d{2}$/.test(k)&&plan[k]&&plan[k].length&&!planMeta[k]){
      planMeta[k]={updatedAt:oldPlanTs||1,clientId:fbClientId,inferred:true};
    }
  });
  var c=loadL('checked');if(c)checked=c;
  var ei=loadL('extraItems');if(ei)extraItems=ei;
  var si=loadL('stockItems');if(si)stockItems=si;
  var sd=loadL('stockDeletes');if(sd)stockDeletes=normaliseStampMap(sd);
  var stp=loadL('stockTemplates');if(stp)stockTemplates=stp.map(normaliseStockTemplate);
  var std=loadL('stockTemplateDeletes');if(std)stockTemplateDeletes=normaliseStampMap(std);
  ensureDefaultStockTemplates();
  saveL('stockTemplates',stockTemplates);
  var al=loadL('activityLog');if(al)activityLog=al.map(normaliseActivity).filter(Boolean).slice(0,40);
  var nb=loadL('newbornChecklist');if(nb)newbornChecklist=nb.map(normaliseChecklistItem).filter(Boolean);
  var sas=loadL('stockAlertState');if(sas&&typeof sas==='object'&&!Array.isArray(sas))stockAlertState=sas;
  sleepyMode=loadL('sleepyMode')===true;
  lastActivitySeen=parseInt(loadL('lastActivitySeen'),10)||0;
  if(sleepyMode)document.body.classList.add('sleepy');
  var ao=loadL('aisleOrder');if(ao&&ao.length===6)aisleOrder=ao;
  var co=loadL('collections');if(co)collections=co;
  var cmt=loadL('customMT');if(cmt)customMT=cmt;
  var dm=loadL('darkMode');if(dm===true)darkMode=true;
  if(darkMode)document.body.classList.add('dark');
  var pf=loadL('profile');if(pf){userAllergens=pf.userAllergens||[];userDiet=pf.userDiet||null;weekStart=typeof pf.weekStart==='number'?pf.weekStart:0;userSupermarket=pf.userSupermarket||'tesco';userAppliances=pf.userAppliances||[];}
  var ak=loadL('apiKey');if(ak)API_KEY=ak;
  var cfg=ensureFBCfgWorkspace(normaliseFBCfg(loadL('fbCfg')));if(cfg&&cfg.url&&cfg.key&&cfg.proj&&cfg.workspace){fbCfg=cfg;saveL('fbCfg',fbCfg);loadFBSDK().then(initFB).catch(function(){});}
}

var _toastTimer=null;
function showToast(msg,undoFn){
  var t=gr('toast');
  if(_toastTimer){clearTimeout(_toastTimer);_toastTimer=null;}
  while(t.firstChild)t.removeChild(t.firstChild);
  var sp=document.createElement('span');sp.textContent=msg;t.appendChild(sp);
  if(typeof undoFn==='function'){
    var ub=document.createElement('button');ub.className='toast-undo-btn';ub.textContent='Undo';
    ub.addEventListener('click',function(e){
      e.stopPropagation();
      if(_toastTimer){clearTimeout(_toastTimer);_toastTimer=null;}
      t.classList.remove('show');
      undoFn();
    });
    t.appendChild(ub);
  }
  t.classList.add('show');
  _toastTimer=setTimeout(function(){t.classList.remove('show');},undoFn?4000:2500);
}
function countUp(el,target,duration){
  if(!el)return;duration=duration||600;
  if(!target){el.textContent='0';return;}
  el.classList.add('counting');
  var startTime=null;
  function step(ts){
    if(!startTime)startTime=ts;
    var p=Math.min((ts-startTime)/duration,1);
    var ease=1-Math.pow(1-p,3);
    el.textContent=Math.round(ease*target);
    if(p<1)requestAnimationFrame(step);
    else{el.textContent=target;el.classList.remove('counting');}
  }
  requestAnimationFrame(step);
}
function addSwipeDelete(host,deleteFn){
  if(!host||!host.firstElementChild||!deleteFn)return;
  var inner=host.firstElementChild;
  var reveal=document.createElement('div');reveal.className='swipe-delete-reveal';
  var lbl=document.createElement('span');lbl.textContent='Delete';reveal.appendChild(lbl);
  host.appendChild(reveal);
  var startX=0,startY=0,active=false,opened=false;
  inner.addEventListener('touchstart',function(e){startX=e.touches[0].clientX;startY=e.touches[0].clientY;active=true;inner.style.transition='none';},{passive:true});
  inner.addEventListener('touchmove',function(e){
    if(!active)return;
    var dx=e.touches[0].clientX-startX,dy=Math.abs(e.touches[0].clientY-startY);
    if(dy>Math.abs(dx)+10||dx>0){active=false;resetSw();return;}
    inner.style.transform='translateX('+Math.max(dx,-88)+'px)';
  },{passive:true});
  inner.addEventListener('touchend',function(){
    if(!active)return;active=false;
    var cx=parseFloat((inner.style.transform||'').replace(/[^-\d.]/g,''))||0;
    inner.style.transition='transform 0.22s cubic-bezier(0.4,0,0.2,1)';
    if(cx<-54){inner.style.transform='translateX(-80px)';opened=true;}else resetSw();
  });
  reveal.addEventListener('click',deleteFn);
  document.addEventListener('touchstart',function(e){if(opened&&!host.contains(e.target))resetSw();},{passive:true});
  function resetSw(){opened=false;inner.style.transition='transform 0.22s cubic-bezier(0.4,0,0.2,1)';inner.style.transform='translateX(0)';}
}
function setupKeyboardHandling(){
  if(!window.visualViewport)return;
  var lastH=window.visualViewport.height;
  window.visualViewport.addEventListener('resize',function(){
    var h=window.visualViewport.height,diff=lastH-h;
    if(diff>80){document.body.classList.add('keyboard-open');document.body.style.setProperty('--keyboard-height',diff+'px');}
    else if(h>lastH-40){document.body.classList.remove('keyboard-open');document.body.style.setProperty('--keyboard-height','0px');}
    lastH=h;
  });
  document.addEventListener('focusin',function(e){
    if(e.target.matches('.sheet input,.sheet textarea,.sheet select')){
      setTimeout(function(){e.target.scrollIntoView({behavior:'smooth',block:'center'});},300);
    }
  });
}

// UTILS
function gr(id){return document.getElementById(id)}
function rec(id){var nid=typeof id==='string'?parseInt(id,10):id;var found=recipes.find(function(r){var rid=typeof r.id==='string'?parseInt(r.id,10):r.id;return rid===nid;});return normaliseRecipe(found);}
function rha(r){return normaliseRecipe(r).allergens.some(function(a){return userAllergens.indexOf(a)>=0})}
function frac(v){if(!v||v===0)return'0';var w=Math.floor(v),f=v-w;var m={'0':'','0.25':'¼','0.5':'½','0.75':'¾','0.33':'⅓','0.67':'⅔'};var bk='0',bd=1;for(var k in m){var d=Math.abs(f-parseFloat(k));if(d<bd){bd=d;bk=k;}}var fp=m[bk]||'';if(w===0)return fp||(v%1===0?''+v:v.toFixed(1));return fp?w+fp:''+w;}
function fmt(q,u){return u?frac(q)+' '+u:frac(q)}
function todayIdx(){return(new Date().getDay()+6)%7;}
// Returns DAYS reordered from weekStart
function orderedDays(){return DAYS.slice(weekStart).concat(DAYS.slice(0,weekStart));}

// NAV
function showTab(n){
  document.querySelectorAll('.panel').forEach(function(p){p.classList.remove('active')});
  document.querySelectorAll('.nav-item').forEach(function(b){b.classList.remove('active')});
  gr('panel-'+n).classList.add('active');var nb=gr('nav-'+n);if(nb)nb.classList.add('active');
  gr('main-content').scrollTop=0;
  if(n==='dashboard')renderDashboard();
  if(n==='shopping')renderShop();
  if(n==='recipes'){renderCF();renderDF();renderRGrid();}
  if(n==='stock')renderStock();
}

// ─── WEEK HELPERS ─────────────────────────────────────────────────────────────
function formatLocalDate(date) {
  var year = date.getFullYear();
  var month = String(date.getMonth() + 1).padStart(2, '0');
  var day = String(date.getDate()).padStart(2, '0');

  return year + '-' + month + '-' + day;
}
function parseLocalDateKey(key) {
  if(!key||!/^\d{4}-\d{2}-\d{2}$/.test(key))return null;
  var parts=key.split('-').map(function(n){return parseInt(n,10);});
  var d=new Date(parts[0],parts[1]-1,parts[2]);
  d.setHours(0,0,0,0);
  return d;
}
function getWeekStartForOffset(offset) {
  var today = new Date();
  today.setHours(0, 0, 0, 0);

  var currentDayIndex = (today.getDay() + 6) % 7;
  var daysSinceWeekStart = (currentDayIndex - weekStart + 7) % 7;

  today.setDate(today.getDate() - daysSinceWeekStart + (offset * 7));

  return today;
}
function getViewedWeekStart() {
  return getWeekStartForOffset(weekOffset);
}
function currentWeekStartKey() {
  return formatLocalDate(getWeekStartForOffset(0));
}
function planKeyFromWeekStart(day, offset, weekStartDate) {
  var dayIndex = DAYS.indexOf(day);
  var offsetFromWeekStart = (dayIndex - weekStart + 7) % 7;
  var mealDate = new Date(weekStartDate);
  mealDate.setDate(mealDate.getDate() + (offset * 7) + offsetFromWeekStart);
  return formatLocalDate(mealDate);
}
function planKey(day) {
  return planKeyFromWeekStart(day, 0, getViewedWeekStart());
}
function migrateLegacyPlan(anchorWeekStartKey) {
  var migrated = false;
  var removedLegacy = false;
  var anchorWeekStart=parseLocalDateKey(anchorWeekStartKey)||getWeekStartForOffset(0);

  Object.keys(plan).forEach(function(oldKey) {
    var match = oldKey.match(
      /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)(?:_w([mp])(\d+))?$/
    );

    if (!match) return;

    var day = match[1];
    var direction = match[2];
    var amount = parseInt(match[3], 10) || 0;
    var oldWeekOffset = direction === 'm' ? -amount : amount;

    var dateKey = planKeyFromWeekStart(day, oldWeekOffset, anchorWeekStart);

    if (!plan[dateKey] && plan[oldKey] && plan[oldKey].length) {
      plan[dateKey] = plan[oldKey].map(function(m,i){return normaliseMeal(m,dateKey,i);});
      touchPlanDate(dateKey);
      migrated = true;
    }
    delete plan[oldKey];
    removedLegacy = true;
  });

  if (migrated||removedLegacy) {
    saveL('plan', plan);
    saveL('planMeta', planMeta);
  }
}
function syncWeekAnchor() {
  var current=currentWeekStartKey();
  var previous=loadL('currentWeekStartDate');
  if(previous&&previous!==current)migrateLegacyPlan(previous);
  saveL('currentWeekStartDate',current);
}

function changeWeek(dir){weekOffset+=dir;renderPlanner();renderShop();}
function weekLabel(){
  if(weekOffset===0)return'This week';
  if(weekOffset===1)return'Next week';
  if(weekOffset===-1)return'Last week';
  return weekOffset>0?'In '+weekOffset+' weeks':Math.abs(weekOffset)+' weeks ago';
}
function getWeekPlan(){
  var wp={};DAYS.forEach(function(d){wp[d]=plan[planKey(d)]||[];});return wp;
}
function getWeekPlanForOffset(offset){
  var wp={},start=getWeekStartForOffset(offset||0);
  DAYS.forEach(function(d){wp[d]=plan[planKeyFromWeekStart(d,0,start)]||[];});
  return wp;
}
function mealDisplayName(m){
  if(!m)return'Missing recipe';
  if(m.manualName)return m.manualName;
  var r=rec(m.recipeId);
  return r?r.name:'Missing recipe';
}
function dashboardPlanDay(offset){
  var date=new Date();
  date.setHours(0,0,0,0);
  date.setDate(date.getDate()+offset);
  var day=DAYS[(date.getDay()+6)%7];
  return{label:offset===0?'Today':'Tomorrow',day:day,key:formatLocalDate(date),meals:plan[formatLocalDate(date)]||[]};
}
// ──────────────────────────────────────────────────────────────────────────────

// PLANNER
function mkEl(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e;}
function renderPlanner(){
  syncWeekAnchor();
  var wp=getWeekPlan();
  var wlEl=gr('week-label');if(wlEl)wlEl.textContent=weekLabel();
  var wstEl=gr('week-sec-title');if(wstEl)wstEl.textContent=weekLabel();
  var tot=Object.values(wp).reduce(function(s,a){return s+(a?a.length:0);},0);
  var grps=consolidate();
  var ti=Object.values(grps).reduce(function(s,a){return s+a.length;},0);
  var sg=gr('stats-grid');sg.innerHTML='';
  [[tot,'Meals'],[ti,'Ingredients'],[recipes.length,'Recipes'],[Object.values(checked).filter(Boolean).length,'Ticked']].forEach(function(x){
    var c=mkEl('div','stat-card');var numEl=mkEl('div','stat-n','0');c.appendChild(numEl);c.appendChild(mkEl('div','stat-l',x[1]));sg.appendChild(c);
    countUp(numEl,x[0],600);
  });
  var pc=gr('planner-content');pc.innerHTML='';
  orderedDays().forEach(function(day,di){
    var meals=wp[day]||[];var isToday=DAYS.indexOf(day)===todayIdx()&&weekOffset===0;
    var dayDiv=mkEl('div','day-expanded');
    var hdr=mkEl('div','day-exp-hdr');
    var tw=mkEl('div');
    var dayTitleEl=mkEl('div','day-exp-title',day);
    if(isToday){var tb=mkEl('small');tb.textContent=' (today)';tb.style.cssText='font-size:12px;color:var(--sage);font-style:italic';dayTitleEl.appendChild(tb);}
    var totalMins=meals.reduce(function(s,m){var r2=rec(m.recipeId);return s+(r2&&r2.time?r2.time:0);},0);
    if(totalMins>0){var ctBadge=mkEl('span','day-cook-time','~'+totalMins+'min');dayTitleEl.appendChild(ctBadge);}
    tw.appendChild(dayTitleEl);
    var addBtn=mkEl('button','btn btns','+');
    (function(d){addBtn.addEventListener('click',function(){openAM(d);});})(day);
    hdr.appendChild(tw);hdr.appendChild(addBtn);dayDiv.appendChild(hdr);
    if(!meals.length){
      var emp=mkEl('div','day-empty-slot');emp.textContent='Tap to add a meal';
      (function(d){emp.addEventListener('click',function(){openAM(d);});})(day);
      dayDiv.appendChild(emp);
    } else {
      meals.forEach(function(m,i){
        var r=rec(m.recipeId);
        if(!r&&m.manualName){
          var manualRow=mkEl('div','day-meal-row');
          var manualInfo=mkEl('div','meal-info');
          manualInfo.appendChild(mkEl('div','meal-label',m.mealType||'Meal'));
          manualInfo.appendChild(mkEl('div','meal-title',m.manualName));
          if(m.note)manualInfo.appendChild(mkEl('div','meal-note','Note: '+m.note));
          var manualMeta=['Manual addition'];
          if(m.manualTime)manualMeta.push(m.manualTime+' min');
          if(m.manualIngredients&&m.manualIngredients.length)manualMeta.push(m.manualIngredients.length+' shopping item'+(m.manualIngredients.length===1?'':'s'));
          manualInfo.appendChild(mkEl('div','meal-meta',manualMeta.join(' - ')));
          var rmManual=mkEl('div','rm-btn','x');
          (function(d2,idx){rmManual.addEventListener('click',function(){rmMeal(d2,idx);});})(day,i);
          manualRow.appendChild(manualInfo);manualRow.appendChild(rmManual);dayDiv.appendChild(manualRow);
          return;
        }
        if(!r){
          var missingRow=mkEl('div','day-meal-row');
          var missingInfo=mkEl('div','meal-info');
          missingInfo.appendChild(mkEl('div','meal-label',m.mealType||'Meal'));
          missingInfo.appendChild(mkEl('div','meal-title','Recipe not synced yet'));
          missingInfo.appendChild(mkEl('div','meal-warn','Missing recipe ID '+m.recipeId+' - tap Refresh to pull latest recipes'));
          var rb=mkEl('button','btn btns','Refresh');rb.style.cssText='flex-shrink:0;font-size:11px;padding:5px 9px';
          rb.addEventListener('click',function(e){e.stopPropagation();refreshSyncNow();});
          var rmMissing=mkEl('div','rm-btn','x');
          (function(d2,idx){rmMissing.addEventListener('click',function(){rmMeal(d2,idx);});})(day,i);
          missingRow.appendChild(missingInfo);missingRow.appendChild(rb);missingRow.appendChild(rmMissing);dayDiv.appendChild(missingRow);
          return;
        }
        var ha=rha(r);var hits=r.allergens.filter(function(a){return userAllergens.indexOf(a)>=0;});
        var row=mkEl('div','day-meal-row');
        var info=mkEl('div','meal-info');info.style.cursor='pointer';
        info.appendChild(mkEl('div','meal-label',m.mealType));
        info.appendChild(mkEl('div','meal-title',r.name));
        if(m.note)info.appendChild(mkEl('div','meal-note','📝 '+m.note));
        if(ha){info.appendChild(mkEl('div','meal-warn','! Contains '+hits.join(', ')));}
        var missingInPlan=getMissingAppliances(r);
        if(missingInPlan.length){info.appendChild(mkEl('div','meal-warn','🔌 Needs: '+missingInPlan.map(function(id){var ap=ALL_APPLIANCES.find(function(a){return a.id===id;});return ap?ap.name:id;}).join(', ')));}
        var baseServings=r.servings||4;var planServings=m.servings||baseServings;
        var metaTxt=r.cuisine+' - '+r.time+' min'+(r.steps&&r.steps.length?' - '+r.steps.length+' steps':'');
        info.appendChild(mkEl('div','meal-meta',metaTxt));
        (function(rid){info.addEventListener('click',function(){openRV(rid);});})(m.recipeId);
        // Servings stepper
        var sWrap=mkEl('div','srv-stepper');
        var sDn=mkEl('button','srv-btn','-');
        var sLbl=mkEl('div','srv-label',planServings+(planServings===1?' serving':' servings'));
        var sUp=mkEl('button','srv-btn','+');
        (function(day, index, base) {
  sDn.addEventListener('click', function(e) {
    e.stopPropagation();

    var k = planKey(day);
    var current = plan[k][index].servings || base;

    plan[k][index].servings = Math.max(1, current - 1);
    plan[k][index].updatedAt = Date.now();

    persist('plan', k);
    renderPlanner();
    renderShop();
  });

  sUp.addEventListener('click', function(e) {
    e.stopPropagation();

    var k = planKey(day);
    var current = plan[k][index].servings || base;

    plan[k][index].servings = current + 1;
    plan[k][index].updatedAt = Date.now();

    persist('plan', k);
    renderPlanner();
    renderShop();
  });
})(day, i, baseServings);
        sWrap.appendChild(sDn);sWrap.appendChild(sLbl);sWrap.appendChild(sUp);
        var vb=mkEl('button','btn btns','View');vb.style.cssText='flex-shrink:0;font-size:11px;padding:5px 9px';
        (function(rid){vb.addEventListener('click',function(e){e.stopPropagation();openRV(rid);});})(m.recipeId);
        var rm=mkEl('div','rm-btn','x');
        (function(d2,idx){rm.addEventListener('click',function(){rmMeal(d2,idx);});})(day,i);
        row.appendChild(info);row.appendChild(sWrap);row.appendChild(vb);row.appendChild(rm);dayDiv.appendChild(row);
      });
    }
    pc.appendChild(dayDiv);
  });
}
function rmMeal(day,i){
  var k=planKey(day);
  var removed=plan[k]?plan[k][i]:null;
  var removedId=removed&&removed.id;
  if(plan[k]){deletePlanMeal(k,plan[k][i]);plan[k].splice(i,1);}
  renderPlanner();persist('plan',k);
  showToast('Meal removed',removed?function(){
    if(!plan[k])plan[k]=[];
    plan[k].push(removed);
    if(removedId&&planMealDeletes[removedId])delete planMealDeletes[removedId];
    renderPlanner();persist('plan',k);showToast('Meal restored');
  }:null);
}

// ─── v5.5 COST ESTIMATION ────────────────────────────────────────────────────
function estimateCost(){
  var sm=SUPERMARKETS.find(function(s){return s.id===userSupermarket;})||SUPERMARKETS[0];
  var grps=consolidate();
  var total=0;
  aisleOrder.forEach(function(cat){
    var items=grps[cat]||[];
    var base=AISLE_BASE_COST[cat]||0.90;
    items.forEach(function(item){
      var cost=base*sm.mult;
      if(item.unit==='g'&&item.qty>500)cost*=1.6;
      else if(item.unit==='kg'&&item.qty>1)cost*=1.8;
      else if(item.unit==='l'&&item.qty>0.5)cost*=1.4;
      total+=cost;
    });
  });
  total+=extraItems.length*(AISLE_BASE_COST.Pantry*sm.mult);
  total+=stockNeedsForShopping().length*(AISLE_BASE_COST.Pantry*sm.mult);
  return{total:Math.round(total*100)/100,sm:sm};
}
function renderCostBanner(){
  var wrap=gr('cost-banner-wrap');if(!wrap)return;
  wrap.innerHTML='';
  var wp=getWeekPlan();
  var tot=Object.values(wp).reduce(function(s,a){return s+(a?a.length:0);},0);
  if(tot===0&&!stockNeedsForShopping().length)return;
  var est=estimateCost();
  var tierClass=est.sm.tier==='budget'?' budget':est.sm.tier==='premium'?' premium':'';
  var banner=document.createElement('div');banner.className='cost-banner'+tierClass;
  var left=document.createElement('div');
  var lbl=document.createElement('div');lbl.className='cost-banner-label';lbl.textContent='Estimated weekly shop';
  var totEl=document.createElement('div');totEl.className='cost-banner-total';totEl.textContent='£'+est.total.toFixed(2);
  var storeEl=document.createElement('div');storeEl.className='cost-banner-store';storeEl.textContent=est.sm.emoji+' '+est.sm.name;
  left.appendChild(lbl);left.appendChild(totEl);left.appendChild(storeEl);
  var right=document.createElement('div');right.style.cssText='text-align:right;flex-shrink:0;margin-left:12px';
  var mealsLbl=document.createElement('div');mealsLbl.style.cssText='font-size:11px;opacity:0.75;margin-bottom:6px';mealsLbl.textContent=tot+' meal'+(tot!==1?'s':'')+' planned';
  var chgBtn=document.createElement('button');
  chgBtn.style.cssText='background:rgba(255,255,255,0.18);color:#fff;border:1px solid rgba(255,255,255,0.3);border-radius:var(--rs);padding:5px 10px;font-size:11px;font-weight:500;cursor:pointer;font-family:\'DM Sans\',sans-serif';
  chgBtn.textContent='Change store';
  chgBtn.addEventListener('click',function(){openProfile();});
  right.appendChild(mealsLbl);right.appendChild(chgBtn);
  banner.appendChild(left);banner.appendChild(right);
  wrap.appendChild(banner);
  var disc=document.createElement('div');disc.className='cost-disclaimer';
  disc.textContent='Rough estimates based on typical '+est.sm.name+' prices — actual costs vary by product and offers.';
  wrap.appendChild(disc);
}
// ─── v5.5 APPLIANCE HELPERS ───────────────────────────────────────────────────
function getRecipeAppliances(r){
  r=normaliseRecipe(r);
  if(r&&r.appliancesManual)return r.appliances.slice();
  if(r&&Array.isArray(r.appliances)&&r.appliances.length)return r.appliances.slice();
  var text=((r.name||'')+' '+(r.desc||'')+' '+(r.steps||[]).join(' ')).toLowerCase();
  var needed=[];
  Object.keys(APPLIANCE_KEYWORDS).forEach(function(id){
    if(APPLIANCE_KEYWORDS[id].some(function(w){return text.indexOf(w)>=0;}))needed.push(id);
  });
  if(!needed.length&&r.ingredients&&r.ingredients.length>2)needed.push('hob');
  return needed;
}
function getMissingAppliances(r){
  if(!userAppliances.length)return[];
  return getRecipeAppliances(r).filter(function(id){return userAppliances.indexOf(id)<0;});
}
// ─────────────────────────────────────────────────────────────────────────────

// SHOPPING
function consolidate(){
  var totals={};
  function addIngredientTotal(ing,scale){
    if(!ing||!ing.name)return;
    var k=String(ing.name).toLowerCase().trim();
    if(!k)return;
    if(!totals[k])totals[k]={name:ing.name,qty:0,unit:ing.unit||''};
    totals[k].qty+=(parseFloat(ing.qty)||1)*(scale||1);
  }
  Object.values(getWeekPlan()).forEach(function(meals){if(!meals)return;meals.forEach(function(m){var r=rec(m.recipeId);if(r){var baseServings=r.servings||4;var planServings=m.servings||baseServings;var scale=planServings/baseServings;r.ingredients.forEach(function(ing){addIngredientTotal(ing,scale);});return;}if(m.manualIngredients&&m.manualIngredients.length)m.manualIngredients.forEach(function(ing){addIngredientTotal(ing,1);});});});
  var cats={};aisleOrder.forEach(function(c){cats[c]=[];});
  Object.values(totals).forEach(function(v){
    var n=v.name.toLowerCase();
    if(PRODUCE.some(function(w){return n.indexOf(w)>=0}))cats.Produce.push(v);
    else if(PROTEIN.some(function(w){return n.indexOf(w)>=0}))cats.Protein.push(v);
    else if(DAIRY.some(function(w){return n.indexOf(w)>=0}))cats.Dairy.push(v);
    else if(PANTRY.some(function(w){return n.indexOf(w)>=0}))cats.Pantry.push(v);
    else if(SPICES.some(function(w){return n.indexOf(w)>=0}))cats.Spices.push(v);
    else cats.Other.push(v);
  });
  return cats;
}
function renderShop(){
  renderCostBanner();
  var el=gr('shop-content');
  var tot=Object.values(getWeekPlan()).reduce(function(s,a){return s+(a?a.length:0)},0);
  var stockHtml=renderStockShoppingHtml();
  if(tot===0&&stockHtml){el.innerHTML=stockHtml;renderExtras();return;}
  if(tot===0){el.innerHTML='<div class="empty"><span class="empty-icon">🛒</span><div class="empty-title">Your list is empty</div><div class="empty-text">Add meals in the Planner tab to generate your shopping list</div></div>';renderExtras();return;}
  var grps=consolidate();var html=stockHtml;
  Object.entries(grps).forEach(function(e){
    var cat=e[0],items=e[1];if(!items.length)return;
    html+='<div class="shop-cat"><div class="shop-cat-hdr"><span>'+cat+'</span><span>'+items.length+' item'+(items.length!==1?'s':'')+'</span></div>';
    items.sort(function(a,b){return a.name.localeCompare(b.name)}).forEach(function(item){
      var k=item.name.toLowerCase().replace(/\s/g,'_');var on=!!checked[k];
      var sn=item.name.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
      html+='<div class="shop-item'+(on?' done':'')+'" id="si-'+k+'">'
           +'<div class="chk'+(on?' on':'')+'" onclick="toggleChk(\''+k+'\')">'
           +'<span class="chk-tick">&#10003;</span></div>'
           +'<div class="si-name">'+item.name+'</div>'
           +'<div class="si-qty">'+fmt(item.qty,item.unit)+'</div>'
           +'<button class="rm-btn" onclick="removeShopItem(event,\''+sn+'\')" title="Remove">x</button>'
           +'</div>';
    });
    html+='</div>';
  });
  el.innerHTML=html;
  renderExtras();
}
function renderStockShoppingHtml(){
  var needs=stockNeedsForShopping();
  if(!needs.length)return '';
  var html='<div class="shop-cat"><div class="shop-cat-hdr"><span>Stock restock</span><span>'+needs.length+' item'+(needs.length!==1?'s':'')+'</span></div>';
  needs.forEach(function(item){
    item=normaliseStockItem(item);
    var k='stock_'+item.id;var on=!!checked[k];
    var need=stockRestockNeed(item);
    var qty=need>0?'buy '+need:(item.qty+' left');
    var note=item.expiry&&isStockExpiring(item)?'Use soon':(stockAlertLevel(item)===2?'Urgent':stockAlertLevel(item)===1?'Low':'Restock');
    html+='<div class="shop-item'+(on?' done':'')+'" id="si-'+k+'">'
         +'<div class="chk'+(on?' on':'')+'" onclick="toggleChk(\''+k+'\')"><span class="chk-tick">&#10003;</span></div>'
         +'<div class="si-name">'+escHtml(item.name)+' <span style="color:var(--ink3);font-size:11px">('+escHtml(note)+')</span></div>'
         +'<div class="si-qty">'+escHtml(qty)+'</div>'
         +'</div>';
  });
  html+='</div>';
  return html;
}
function removeShopItem(ev, name) {
  ev.stopPropagation();

  if (!confirm(
    'Remove "' + name + '" from the list?\n\n' +
    'This removes the meal(s) that use this ingredient from your planner.'
  )) return;

  var lower = name.toLowerCase().trim();
  var changedDates = [];

  DAYS.forEach(function(day) {
    var k = planKey(day);
    var existingMeals = plan[k] || [];

    var remainingMeals = existingMeals.filter(function(meal) {
      var recipe = rec(meal.recipeId);
      if (!recipe) return true;

      return !recipe.ingredients.some(function(ingredient) {
        return ingredient.name.toLowerCase().trim() === lower;
      });
    });

    if (remainingMeals.length !== existingMeals.length) {
      existingMeals.forEach(function(meal){
        if(remainingMeals.indexOf(meal)<0)deletePlanMeal(k,meal);
      });
      plan[k] = remainingMeals;
      changedDates.push(k);
    }
  });

  changedDates.forEach(function(dateKey) {
    persist('plan', dateKey);
  });

  renderPlanner();
  renderShop();
  showToast(name + ' removed');
}
function renderExtras(){
  var el=gr('extras-list');if(!el)return;
  if(!extraItems.length){el.innerHTML='<div style="font-size:13px;color:var(--ink3);padding:4px 0">No extras added yet</div>';return;}
  el.innerHTML=extraItems.map(function(item,i){
    var k='extra_'+i;var on=!!checked[k];
    return '<div class="shop-item'+(on?' done':'')+'" id="si-'+k+'">'
          +'<div class="chk'+(on?' on':'')+'" onclick="toggleChk(\''+k+'\')">'
          +'<span class="chk-tick">&#10003;</span></div>'
          +'<div class="si-name">'+escHtml(item)+'</div>'
          +'<button class="rm-btn" onclick="removeExtra('+i+')" title="Remove">x</button>'
          +'</div>';
  }).join('');
}
function addExtra(){
  var inp=gr('extra-input');var val=inp.value.trim();if(!val)return;
  var added=val.split(',').map(function(v){return v.trim();}).filter(Boolean);
  added.forEach(function(v){extraItems.push(v);});
  inp.value='';persist('extraItems',{type:'add',items:added});renderExtras();
}
function removeExtra(i){
  var item=extraItems[i];
  extraItems.splice(i,1);
  persist('extraItems',{type:'remove',item:item});
  renderExtras();
  showToast('Removed',item?function(){
    extraItems.push(item);
    persist('extraItems',{type:'add',items:[item]});
    renderExtras();showToast(item+' restored');
  }:null);
}
function extraKD(e){if(e.key==='Enter'){e.preventDefault();addExtra();}}
function toggleChk(k){checked[k]=!checked[k];persist('checked',k);var el=gr('si-'+k);if(el){el.className='shop-item'+(checked[k]?' done':'');var chk=el.querySelector('.chk');chk.className='chk'+(checked[k]?' on':'');}}
function clearChecks(){checked={};persist('checked','__clear__');renderShop();}

// RECIPES
function renderCF(){gr('c-filters').innerHTML=CUISINES.map(function(c){return'<button class="fchip'+(aCuisine===c?' on':'')+'" onclick="setC(\''+c+'\')">'+c+'</button>'}).join('');}
function renderDF(){gr('d-filters').innerHTML=['Any'].concat(DIETS).map(function(d){return'<button class="fchip'+(aDiet===d?' on':'')+'" onclick="setD(\''+d+'\')">'+d+'</button>'}).join('');}
function setC(c){aCuisine=c;renderCF();renderRGrid();}
function setD(d){aDiet=d;renderDF();renderRGrid();}
function makeRCard(r){
  r.allergens=r.allergens||[];r.diets=r.diets||[];r.ingredients=r.ingredients||[];r.steps=r.steps||[];
  var ha=rha(r);
  var hits=r.allergens.filter(function(a){return userAllergens.indexOf(a)>=0;});
  var card=document.createElement('div');
  card.className='rcard'+(ha?' ha':'');
  var cuisineFlag=CUISINE_FLAGS[r.cuisine]||'';
  if(r.image){
    var imgWrap=document.createElement('div');imgWrap.className='rc-img-wrap';
    var thmb=document.createElement('img');thmb.src='data:image/jpeg;base64,'+r.image;thmb.alt=r.name;imgWrap.appendChild(thmb);
    var grad=document.createElement('div');grad.className='rc-img-gradient';imgWrap.appendChild(grad);
    if(cuisineFlag){var badge=document.createElement('div');badge.className='rc-cuisine-badge';badge.textContent=cuisineFlag;imgWrap.appendChild(badge);}
    var imgMeta=document.createElement('div');imgMeta.className='rc-img-meta';
    var nameOvl=document.createElement('div');nameOvl.className='rc-img-name';nameOvl.textContent=r.name;imgMeta.appendChild(nameOvl);
    if(r.time){var tChip=document.createElement('div');tChip.className='rc-time-chip';tChip.textContent=r.time+'min';imgMeta.appendChild(tChip);}
    imgWrap.appendChild(imgMeta);card.appendChild(imgWrap);
  }
  var nm=document.createElement('div');nm.className='rc-name';nm.textContent=(cuisineFlag&&!r.image?cuisineFlag+' ':'')+r.name;card.appendChild(nm);
  var metaParts=[r.cuisine,r.time+' min','serves '+(r.servings||4),r.ingredients.length+' ingredients'];
  if(r.steps&&r.steps.length)metaParts.push(r.steps.length+' steps');
  var meta=document.createElement('div');meta.className='rc-meta';meta.textContent=metaParts.join(' - ');card.appendChild(meta);
  if(r.rating||r.cookCount){
    var statRow=document.createElement('div');statRow.style.cssText='display:flex;align-items:center;gap:8px;margin-bottom:6px';
    if(r.rating){var stars=document.createElement('span');stars.style.cssText='color:var(--warm);font-size:13px';stars.textContent='★'.repeat(r.rating)+'☆'.repeat(5-r.rating);statRow.appendChild(stars);}
    if(r.cookCount){var cb=document.createElement('span');cb.className='cook-badge';cb.textContent='🍳 ×'+r.cookCount;statRow.appendChild(cb);}
    card.appendChild(statRow);
  }
  if(r.lastCooked){var lc=document.createElement('div');lc.className='last-cooked';lc.textContent='Last cooked: '+fmtDate(r.lastCooked);card.appendChild(lc);}
  var rColls=collections.filter(function(c){return(c.recipes||[]).indexOf(r.id)>=0;});
  if(rColls.length){var ct=document.createElement('div');ct.style.cssText='display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px';rColls.forEach(function(c){var ch=document.createElement('span');ch.style.cssText='font-size:10px;background:var(--warm-p);color:#6b4c1e;border-radius:10px;padding:2px 7px;font-weight:500';ch.textContent='📁 '+c.name;ct.appendChild(ch);});card.appendChild(ct);}
  if(r.notes){var rn=document.createElement('div');rn.className='rn-box';rn.textContent='📝 '+r.notes;card.appendChild(rn);}
  if(r.source_book||r.source_page){var src=document.createElement('div');src.className='rc-source';src.textContent='Book: '+(r.source_book||'')+(r.source_page?' p.'+r.source_page:'');card.appendChild(src);}
  if(r.source_url){var ul=document.createElement('a');ul.href=r.source_url;ul.target='_blank';ul.rel='noopener';ul.style.cssText='font-size:12px;color:var(--sage);display:block;margin-bottom:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%';ul.textContent='🔗 '+r.source_url.replace(/^https?:\/\//,'').replace(/\/$/,'').substring(0,60);card.appendChild(ul);}
  var tags=document.createElement('div');tags.className='rc-tags';
  r.diets.forEach(function(d){var t=document.createElement('span');t.className='tag tg';t.textContent=d;tags.appendChild(t);});
  r.allergens.forEach(function(a){var t=document.createElement('span');t.className='tag '+(hits.indexOf(a)>=0?'tr':'tgr');t.textContent=a;tags.appendChild(t);});
  card.appendChild(tags);
  if(ha){var w=document.createElement('div');w.className='rc-warn';var s1=document.createElement('span');s1.textContent='!';var s2=document.createElement('span');s2.textContent='Contains '+hits.join(', ');w.appendChild(s1);w.appendChild(s2);card.appendChild(w);}
  var missingApp=getMissingAppliances(r);
  if(missingApp.length){var aw=document.createElement('div');aw.className='app-warn';var awI=document.createElement('span');awI.textContent='🔌';var awT=document.createElement('span');awT.textContent='May need: '+missingApp.map(function(id){var ap=ALL_APPLIANCES.find(function(a){return a.id===id;});return ap?ap.emoji+' '+ap.name:id;}).join(', ');aw.appendChild(awI);aw.appendChild(awT);card.appendChild(aw);}
  var acts=document.createElement('div');acts.className='rc-actions';
  var vb=document.createElement('button');vb.className='btn btns';vb.textContent='View';vb.style.flex='1';
  (function(id){vb.addEventListener('click',function(){openRV(id);});})(r.id);
  var pb=document.createElement('button');pb.className='btn btns btnp';pb.textContent='+ Plan';
  (function(id){pb.addEventListener('click',function(){openAMForR(id);});})(r.id);
  var eb=document.createElement('button');eb.className='btn btns';eb.textContent='Edit';
  (function(id){eb.addEventListener('click',function(){openEditR(id);});})(r.id);
  var dup=document.createElement('button');dup.className='btn btns btndup';dup.textContent='⧉ Dup';
  (function(id){dup.addEventListener('click',function(){dupR(id);});})(r.id);
  var db=document.createElement('button');db.className='btn btns btnd';db.textContent='Delete';
  (function(id){db.addEventListener('click',function(){delR(id);});})(r.id);
  acts.appendChild(vb);acts.appendChild(pb);acts.appendChild(eb);acts.appendChild(dup);acts.appendChild(db);
  card.appendChild(acts);
  return card;
}
function renderCollFilters(){
  var el=gr('coll-filters');if(!el)return;
  el.innerHTML='';
  var chips=['All'].concat(collections.map(function(c){return c.name;}));
  chips.forEach(function(c){
    var btn=document.createElement('button');
    btn.className='fchip'+(aCollection===c?' on':'');
    btn.textContent=(c==='All'?'All':'📁 '+c);
    (function(name){btn.addEventListener('click',function(){setCollFilter(name);});})(c);
    el.appendChild(btn);
  });
  var mgr=document.createElement('button');mgr.className='fchip';mgr.textContent='+ Manage';mgr.style.borderStyle='dashed';
  mgr.addEventListener('click',function(){openCollManager();});
  el.appendChild(mgr);
}
function setCollFilter(c){aCollection=c;renderCollFilters();renderRGrid();}
function firstLetter(name){var ch=String(name||'#').trim().charAt(0).toUpperCase();return /^[A-Z]$/.test(ch)?ch:'#';}
function addAlphaRail(layout,letters,prefix){
  prefix=prefix||'letter-';
  var rail=document.createElement('div');rail.className='alpha-rail';
  letters.forEach(function(l){
    var b=document.createElement('button');b.textContent=l;
    b.addEventListener('click',function(){var a=gr(prefix+l);if(a)a.scrollIntoView({block:'start'});});
    rail.appendChild(b);
  });
  layout.appendChild(rail);
}
function renderRGrid(){
  renderCollFilters();
  var s=gr('rsearch')?gr('rsearch').value.toLowerCase():'';
  var filtered=recipes.filter(function(r){
    if(aCuisine!=='Any'&&r.cuisine!==aCuisine)return false;
    if(aDiet!=='Any'&&r.diets.indexOf(aDiet)<0)return false;
    if(s&&r.name.toLowerCase().indexOf(s)<0)return false;
    if(aCollection!=='All'){var coll=collections.find(function(c){return c.name===aCollection;});if(!coll||(coll.recipes||[]).indexOf(r.id)<0)return false;}
    return true;
  });
  var rg=gr('rgrid');if(!rg)return;
  rg.innerHTML='';
  if(!filtered.length){
    var emp=document.createElement('div');emp.className='empty';
    var isSearch=(s&&s.length>0)||(aCuisine!=='Any')||(aDiet!=='Any')||(aCollection!=='All');
    emp.innerHTML='<span class="empty-icon">'+(isSearch?'🔍':'📖')+'</span><div class="empty-title">'+(isSearch?'No matches found':'No recipes yet')+'</div><div class="empty-text">'+(isSearch?'Try clearing filters or searching differently':'Import from a URL, photo, or add one manually')+'</div>';
    rg.appendChild(emp);return;
  }
  filtered.sort(function(a,b){return String(a.name||'').localeCompare(String(b.name||''));});
  var layout=document.createElement('div');layout.className='alpha-layout';
  var list=document.createElement('div');var letters=[];
  filtered.forEach(function(r){
    var l=firstLetter(r.name);
    if(letters.indexOf(l)<0){letters.push(l);var anchor=document.createElement('div');anchor.id='recipe-letter-'+l;anchor.className='letter-anchor';list.appendChild(anchor);}
    try{list.appendChild(makeRCard(r));}catch(e){}
  });
  layout.appendChild(list);addAlphaRail(layout,letters,'recipe-letter-');rg.appendChild(layout);
}
function delR(id){
  if(!confirm('Delete this recipe?'))return;
  var existing=rec(id);
  var deletedAt=Date.now();
  recipeDeletes[String(id)]=deletedAt;
  recipes=recipes.filter(function(recipe){return recipe.id!==id;});
  var changedDates=[];
  var removedMeals={};
  Object.keys(plan).forEach(function(dateKey){
    var existingMeals=plan[dateKey]||[];
    var remainingMeals=existingMeals.filter(function(meal){return meal.recipeId!==id;});
    if(remainingMeals.length!==existingMeals.length){
      removedMeals[dateKey]=existingMeals.filter(function(meal){return meal.recipeId===id;});
      existingMeals.forEach(function(meal){if(remainingMeals.indexOf(meal)<0)deletePlanMeal(dateKey,meal);});
      plan[dateKey]=remainingMeals;changedDates.push(dateKey);
    }
  });
  persist('recipes');
  changedDates.forEach(function(dateKey){persist('plan',dateKey);});
  renderAll();
  showToast('Recipe deleted',existing?function(){
    delete recipeDeletes[String(id)];
    recipes.push(existing);
    changedDates.forEach(function(dateKey){
      if(removedMeals[dateKey]){
        removedMeals[dateKey].forEach(function(meal){if(meal.id&&planMealDeletes[meal.id])delete planMealDeletes[meal.id];});
        plan[dateKey]=(plan[dateKey]||[]).concat(removedMeals[dateKey]);
      }
      persist('plan',dateKey);
    });
    persist('recipes');renderAll();showToast('Recipe restored');
  }:null);
}
function dupR(id){
  var r=rec(id);if(!r)return;
  var copy=JSON.parse(JSON.stringify(r));
  copy.id=Date.now();copy.name=r.name+' (copy)';copy.cookCount=0;copy.rating=0;copy.updatedAt=Date.now();
  recipes.push(copy);persist('recipes');renderRGrid();showToast('Recipe duplicated');
}
function markCooked(id,btn,starEl){
  var r=rec(id);if(!r)return;
  r.cookCount=(r.cookCount||0)+1;
  r.lastCooked=Date.now();
  r.updatedAt=Date.now();
  persist('recipes');renderRGrid();
  if(starEl)starEl.textContent='★'.repeat(r.rating||0)+'☆'.repeat(5-(r.rating||0))+' · cooked '+r.cookCount+'×';
  showToast('Marked as cooked! (×'+r.cookCount+')');
}

// ─── SHARE SHOPPING LIST ───────────────────────────────────────────────────────
function shareShopList(){
  var grps=consolidate();
  var stockNeeds=stockNeedsForShopping();
  var lines=['🛒 Shopping list — '+weekLabel(),''];
  aisleOrder.forEach(function(cat){
    var items=grps[cat];if(!items||!items.length)return;
    lines.push('── '+cat+' ──');
    items.sort(function(a,b){return a.name.localeCompare(b.name);}).forEach(function(item){
      var k=item.name.toLowerCase().replace(/\s/g,'_');
      lines.push((checked[k]?'✓ ':'  ')+item.name+(item.qty?'  ('+fmt(item.qty,item.unit)+')':''));
    });
    lines.push('');
  });
  if(stockNeeds.length){
    lines.push('-- Stock restock --');
    stockNeeds.forEach(function(item){
      item=normaliseStockItem(item);
      var need=stockRestockNeed(item);
      var reason=item.expiry&&isStockExpiring(item)?'use soon':(stockAlertLevel(item)===2?'urgent':stockAlertLevel(item)===1?'low':'restock');
      lines.push('  '+item.name+' ('+(need>0?'buy '+need:item.qty+' left')+', '+reason+')');
    });
    lines.push('');
  }
  if(extraItems.length){
    lines.push('── Extras ──');
    extraItems.forEach(function(e){lines.push('  '+e);});
  }
  gr('share-txt').textContent=lines.join('\n').trim();
  openM('modal-share');
}
function copyShareList(){
  var txt=gr('share-txt').textContent;
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).then(function(){showToast('Copied!');}).catch(function(){fbCopy(txt);});
  }else{fbCopy(txt);}
}
function fbCopy(txt){
  var ta=document.createElement('textarea');ta.value=txt;
  ta.style.cssText='position:fixed;top:-9999px;left:-9999px;opacity:0';
  document.body.appendChild(ta);ta.focus();ta.select();
  try{document.execCommand('copy');showToast('Copied!');}catch(e){showToast('Select text above and copy manually');}
  document.body.removeChild(ta);
}

// ─── AISLE ORDER ──────────────────────────────────────────────────────────────
function openAisleOrder(){renderAisleList();openM('modal-aisle');}
function renderAisleList(){
  var el=gr('aisle-list');if(!el)return;el.innerHTML='';
  aisleOrder.forEach(function(cat,i){
    var row=document.createElement('div');row.className='aisle-row';
    var handle=document.createElement('span');handle.className='aisle-handle';handle.textContent='⠿';
    var name=document.createElement('span');name.className='aisle-name';name.textContent=cat;
    var up=document.createElement('button');up.className='aisle-move';up.innerHTML='&#8593;';up.disabled=(i===0);
    var dn=document.createElement('button');dn.className='aisle-move';dn.innerHTML='&#8595;';dn.disabled=(i===aisleOrder.length-1);
    (function(idx){
      up.addEventListener('click',function(){moveAisle(idx,-1);});
      dn.addEventListener('click',function(){moveAisle(idx,1);});
    })(i);
    row.appendChild(handle);row.appendChild(name);row.appendChild(up);row.appendChild(dn);
    el.appendChild(row);
  });
}
function moveAisle(i,dir){
  var j=i+dir;if(j<0||j>=aisleOrder.length)return;
  var tmp=aisleOrder[i];aisleOrder[i]=aisleOrder[j];aisleOrder[j]=tmp;
  persist();renderAisleList();if(gr('panel-shopping').classList.contains('active'))renderShop();
}
// ──────────────────────────────────────────────────────────────────────────────

// ─── UTILITIES ────────────────────────────────────────────────────────────────
function fmtDate(ts){
  if(!ts)return'';
  var d=new Date(ts);var now=new Date();
  var days=Math.floor((now-d)/86400000);
  if(days===0)return'today';if(days===1)return'yesterday';
  if(days<7)return days+'d ago';if(days<14)return'1w ago';
  if(days<30)return Math.floor(days/7)+'w ago';
  if(days<365)return Math.floor(days/30)+'mo ago';
  return Math.floor(days/365)+'y ago';
}

// ─── DARK MODE ────────────────────────────────────────────────────────────────
function toggleDark(){
  darkMode=!darkMode;
  document.body.classList.toggle('dark',darkMode);
  saveL('darkMode',darkMode);
}

// ─── COLLECTIONS ─────────────────────────────────────────────────────────────
function openCollManager(){renderCollManageList();openM('modal-colls');}
function addColl(){
  var inp=gr('coll-new-input');var name=inp.value.trim();if(!name)return;
  if(collections.find(function(c){return c.name===name;})){showToast('Already exists');return;}
  var coll={id:Date.now(),name:name,recipes:[]};
  collections.push(coll);
  inp.value='';persist('collections',{type:'add',item:coll});renderCollManageList();renderCollFilters();showToast('Collection added');
}
function collKD(e){if(e.key==='Enter'){e.preventDefault();addColl();}}
function deleteColl(id){
  collections=collections.filter(function(c){return c.id!==id;});
  if(aCollection!=='All'){aCollection='All';}
  persist('collections',{type:'remove',id:id});renderCollManageList();renderCollFilters();renderRGrid();
}
function toggleRecipeColl(collId,recipeId){
  var c=collections.find(function(x){return x.id===collId;});if(!c)return;
  c.recipes=c.recipes||[];
  var idx=c.recipes.indexOf(recipeId);
  if(idx>=0)c.recipes.splice(idx,1);else c.recipes.push(recipeId);
  persist('collections',{type:'update',item:c});
}
function renderCollManageList(){
  var el=gr('coll-manage-list');if(!el)return;
  if(!collections.length){el.innerHTML='<div style="font-size:13px;color:var(--ink3);padding:8px 0">No collections yet — add one above</div>';return;}
  el.innerHTML='';
  collections.forEach(function(c){
    var row=document.createElement('div');row.className='coll-row';
    var name=document.createElement('span');name.className='coll-name-lbl';
    name.textContent=c.name+' · '+(c.recipes?c.recipes.length:0)+' recipe'+(c.recipes&&c.recipes.length!==1?'s':'');
    var rm=document.createElement('button');rm.className='btn btns btnd';rm.textContent='Delete';rm.style.flexShrink='0';
    (function(id,n){rm.addEventListener('click',function(){if(confirm('Delete "'+n+'"?'))deleteColl(id);});})(c.id,c.name);
    row.appendChild(name);row.appendChild(rm);el.appendChild(row);
  });
}
function renderRVColls(rid,container){
  container.innerHTML='';
  if(!collections.length)return;
  var ttl=document.createElement('div');ttl.style.cssText='font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--ink3);margin-bottom:8px';ttl.textContent='Collections';
  container.appendChild(ttl);
  var chips=document.createElement('div');chips.style.cssText='display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px';
  collections.forEach(function(c){
    var on=(c.recipes||[]).indexOf(rid)>=0;
    var ch=document.createElement('button');ch.className='coll-chip'+(on?' on':'');ch.textContent=(on?'✔ ':'')+c.name;
    (function(cid,btn,rId){ch.addEventListener('click',function(){
      toggleRecipeColl(cid,rId);
      var nowOn=(collections.find(function(x){return x.id===cid;}).recipes||[]).indexOf(rId)>=0;
      btn.className='coll-chip'+(nowOn?' on':'');btn.textContent=(nowOn?'✔ ':'')+c.name;
      renderRGrid();
    });})(c.id,ch,rid);
    chips.appendChild(ch);
  });
  container.appendChild(chips);
}

// ─── MEAL TYPES ───────────────────────────────────────────────────────────────
function openMTManager(){renderMTChips();openM('modal-mttypes');}
function addMT(){
  var inp=gr('mt-new-input');var name=inp.value.trim();if(!name)return;
  if(MT.indexOf(name)>=0){showToast('Already exists');return;}
  customMT.push(name);refreshMT();inp.value='';persist('customMT',{type:'add',item:name});renderMTChips();renderAMT();showToast('Meal type added');
}
function mtKD(e){if(e.key==='Enter'){e.preventDefault();addMT();}}
function removeMT(name){
  customMT=customMT.filter(function(t){return t!==name;});
  refreshMT();persist('customMT',{type:'remove',item:name});renderMTChips();renderAMT();
}
function renderMTChips(){
  var el=gr('mt-chips');if(!el)return;el.innerHTML='';
  MT_BASE.forEach(function(t){var ch=document.createElement('span');ch.className='tchip on';ch.style.cssText='cursor:default;opacity:0.55';ch.textContent=t;el.appendChild(ch);});
  customMT.forEach(function(t){
    var ch=document.createElement('span');ch.className='tchip on';
    var txt=document.createTextNode(t+' ');ch.appendChild(txt);
    var xb=document.createElement('button');xb.style.cssText='background:none;border:none;cursor:pointer;color:inherit;font-size:14px;padding:0;font-weight:700;line-height:1';xb.textContent='×';
    (function(n){xb.addEventListener('click',function(){removeMT(n);});})(t);
    ch.appendChild(xb);el.appendChild(ch);
  });
}
function renderMTChipsInline(){
  var el=gr('mt-chips-inline');if(!el)return;el.innerHTML='';
  if(!customMT.length){var note=document.createElement('div');note.style.cssText='font-size:12px;color:var(--ink3);margin-bottom:8px';note.textContent='No custom types yet';el.appendChild(note);return;}
  customMT.forEach(function(t){
    var ch=document.createElement('span');ch.className='tchip on';ch.style.marginBottom='4px';
    var txt=document.createTextNode(t+' ');ch.appendChild(txt);
    var xb=document.createElement('button');xb.style.cssText='background:none;border:none;cursor:pointer;color:inherit;font-size:14px;padding:0;font-weight:700;line-height:1';xb.textContent='×';
    (function(n){xb.addEventListener('click',function(){removeMT(n);renderMTChipsInline();renderAMT();});})(t);
    ch.appendChild(xb);el.appendChild(ch);
  });
}
function toggleMTPanel(){
  var panel=gr('mt-inline-panel');if(!panel)return;
  var isOpen=panel.style.display!=='none';
  panel.style.display=isOpen?'none':'block';
  var btn=gr('mt-toggle-btn');if(btn)btn.textContent=isOpen?'⚙ Customise':'✕ Close';
  if(!isOpen)renderMTChipsInline();
}
function addMTInline(){
  var inp=gr('mt-new-inline');if(!inp)return;
  var name=inp.value.trim();if(!name)return;
  if(MT.indexOf(name)>=0){showToast('Already exists');return;}
  customMT.push(name);refreshMT();inp.value='';persist('customMT',{type:'add',item:name});renderMTChipsInline();renderAMT();showToast('Added: '+name);
}
function mtKDInline(e){if(e.key==='Enter'){e.preventDefault();addMTInline();}}
// ──────────────────────────────────────────────────────────────────────────────

function openRV(id){
  var r=rec(id);if(!r)return;
  var ha=rha(r);var hits=r.allergens.filter(function(a){return userAllergens.indexOf(a)>=0;});
  var cont=gr('rv-content');cont.innerHTML='';
  if(r.image){var rvi=document.createElement('img');rvi.className='rv-img';rvi.src='data:image/jpeg;base64,'+r.image;rvi.alt=r.name;cont.appendChild(rvi);}
  var hero=mkEl('div','rv-hero');
  hero.appendChild(mkEl('div','rv-title',r.name));
  var meta=[r.cuisine,r.time+' min','serves '+(r.servings||4)];
  if(r.ingredients.length)meta.push(r.ingredients.length+' ingredients');
  if(r.steps&&r.steps.length)meta.push(r.steps.length+' steps');
  hero.appendChild(mkEl('div','rv-meta',meta.join(' - ')));
  if(r.rating){var rstar=mkEl('div');rstar.style.cssText='color:var(--warm);font-size:14px;margin-top:6px';rstar.textContent='★'.repeat(r.rating)+'☆'.repeat(5-r.rating)+(r.cookCount?' · cooked '+r.cookCount+'×':'');hero.appendChild(rstar);}
  if(r.desc)hero.appendChild(mkEl('div','rv-desc',r.desc));
  if(r.source_url){var sul=document.createElement('a');sul.href=r.source_url;sul.target='_blank';sul.rel='noopener';sul.style.cssText='font-size:12px;color:#7fcf7f;display:block;margin-top:8px;word-break:break-all';sul.textContent='🔗 '+r.source_url.replace(/^https?:\/\//,'');hero.appendChild(sul);}
  if(r.source_book||r.source_page){var src=mkEl('div','rv-source','Book: '+(r.source_book||'')+(r.source_page?' p.'+r.source_page:''));hero.appendChild(src);}
  cont.appendChild(hero);
  if(r.diets.length||r.allergens.length){var tags=mkEl('div');tags.style.cssText='display:flex;flex-wrap:wrap;gap:5px;margin-bottom:16px';r.diets.forEach(function(d){tags.appendChild(mkEl('span','tag tg',d));});r.allergens.forEach(function(a){tags.appendChild(mkEl('span','tag '+(hits.indexOf(a)>=0?'tr':'tgr'),a));});cont.appendChild(tags);}
  if(ha){var w=mkEl('div','rc-warn');w.style.marginBottom='16px';w.appendChild(mkEl('span','','!'));w.appendChild(mkEl('span','','Contains: '+hits.join(', ')));cont.appendChild(w);}
  var neededApp=getRecipeAppliances(r);
  if(neededApp.length){
    var appRow=document.createElement('div');appRow.style.cssText='display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:16px';
    var appLbl=document.createElement('span');appLbl.style.cssText='font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--ink3)';appLbl.textContent='Needs:';
    appRow.appendChild(appLbl);
    neededApp.forEach(function(id){
      var ap=ALL_APPLIANCES.find(function(a){return a.id===id;});if(!ap)return;
      var missing=userAppliances.length>0&&userAppliances.indexOf(id)<0;
      var chip=document.createElement('span');
      chip.style.cssText='padding:4px 10px;border-radius:20px;font-size:12px;font-weight:500;border:1px solid;'+(missing?'background:var(--warm-p);color:#5a3a10;border-color:var(--warm)':'background:var(--sage-p);color:var(--sage);border-color:var(--sage-p)');
      chip.textContent=ap.emoji+' '+ap.name+(missing?' ✕':'');
      appRow.appendChild(chip);
    });
    cont.appendChild(appRow);
  }
  // Servings scaler
  var rvServings=r.servings||4;
  var rvSWrap=mkEl('div');rvSWrap.style.cssText='display:flex;align-items:center;gap:10px;margin-bottom:16px;background:var(--paper2);border-radius:var(--rs);padding:10px 14px';
  var rvSLbl=mkEl('div');rvSLbl.style.cssText='font-size:13px;color:var(--ink2);flex:1';
  var rvDn=mkEl('button','srv-btn','-');var rvUp=mkEl('button','srv-btn','+');
  var iList=mkEl('div');
  function updateRVIngredients(){
    var scale=rvServings/(r.servings||4);
    rvSLbl.textContent='Serves '+rvServings+(scale!==1?' (×'+Math.round(scale*10)/10+')':'');
    var qEls=iList.querySelectorAll('.ing-qty');
    r.ingredients.forEach(function(ing,idx){if(qEls[idx])qEls[idx].textContent=fmt(ing.qty*scale,ing.unit);});
  }
  rvDn.addEventListener('click',function(){if(rvServings>1){rvServings--;updateRVIngredients();}});
  rvUp.addEventListener('click',function(){rvServings++;updateRVIngredients();});
  rvSWrap.appendChild(rvDn);rvSWrap.appendChild(rvSLbl);rvSWrap.appendChild(rvUp);
  cont.appendChild(rvSWrap);
  var iSec=mkEl('div','rv-section');iSec.appendChild(mkEl('div','rv-section-title','Ingredients'));
  r.ingredients.forEach(function(ing){var row=mkEl('div','ing-list-item');row.appendChild(mkEl('div','ing-dot'));var nm=mkEl('div','ing-name',ing.name);nm.style.flex='1';row.appendChild(nm);row.appendChild(mkEl('div','ing-qty',fmt(ing.qty,ing.unit)));iList.appendChild(row);});
  iSec.appendChild(iList);
  updateRVIngredients();
  cont.appendChild(iSec);
  var sSec=mkEl('div','rv-section');sSec.appendChild(mkEl('div','rv-section-title','Method'));
  if(r.steps&&r.steps.length){r.steps.forEach(function(s,i){var row=mkEl('div','step-row');row.appendChild(mkEl('div','step-num',String(i+1)));row.appendChild(mkEl('div','step-text',s));sSec.appendChild(row);});}
  else{var ns=mkEl('div');ns.textContent='No method added yet - tap Edit to add steps';ns.style.cssText='padding:16px;text-align:center;color:var(--ink3);font-size:13px;background:var(--paper2);border-radius:var(--rs)';sSec.appendChild(ns);}
  cont.appendChild(sSec);
  if(r.notes){var rnDiv=mkEl('div','rn-box');rnDiv.style.marginBottom='16px';rnDiv.textContent='📝 '+r.notes;cont.appendChild(rnDiv);}
  var collCont=mkEl('div');cont.appendChild(collCont);renderRVColls(r.id,collCont);
  var act=mkEl('div');act.style.cssText='display:flex;gap:8px;margin-top:4px;padding-bottom:8px;flex-wrap:wrap';
  var planBtn=mkEl('button','btn btnp','+ Add to planner');planBtn.style.flex='1';
  (function(rid){planBtn.addEventListener('click',function(){openAMForR(rid);closeM('modal-rv');});})(r.id);
  var stockBtn=mkEl('button','btn btnw','+ Freezer stock');
  (function(rid){stockBtn.addEventListener('click',function(){openRecipeStockModal(rid);closeM('modal-rv');});})(r.id);
  var cookBtn=mkEl('button','btn btnw','🍳 Mark cooked');
  (function(rid){cookBtn.addEventListener('click',function(){markCooked(rid,cookBtn,rstar);});})(r.id);
  var editBtn=mkEl('button','btn','Edit');
  (function(rid){editBtn.addEventListener('click',function(){openEditR(rid);closeM('modal-rv');});})(r.id);
  act.appendChild(planBtn);act.appendChild(stockBtn);act.appendChild(cookBtn);act.appendChild(editBtn);cont.appendChild(act);
  openM('modal-rv');
}

// ADD MEAL MODAL
function renderAMD(){gr('am-days').innerHTML=DAYS.map(function(d){return'<button class="day-sel-btn'+(amDay===d?' on':'')+'" onclick="selAMD(\''+d+'\')">'+d.slice(0,3)+'</button>'}).join('');}
function renderAMT(){gr('am-types').innerHTML=MT.map(function(t){return'<button class="tchip'+(amType===t?' on':'')+'" onclick="selAMT(\''+t+'\')">'+t+'</button>'}).join('');}
function selAMD(d){amDay=d;renderAMD();}
function selAMT(t){amType=t;renderAMT();}
function renderAML(){
  var s=gr('am-search').value.toLowerCase();
  var f=recipes.filter(function(r){return!s||r.name.toLowerCase().indexOf(s)>=0});
  var el=gr('am-list');
  if(!f.length){el.innerHTML='<div style="padding:16px;text-align:center;color:var(--ink3);font-size:13px">No recipes found</div>';return;}
  el.innerHTML=f.map(function(r){var ha=rha(r);var sel=amRecipe===r.id;var hits=r.allergens.filter(function(a){return userAllergens.indexOf(a)>=0});return'<div class="rpick'+(sel?' on':'')+'" onclick="selAMR('+r.id+')"><div style="font-size:13px;font-weight:500;margin-bottom:2px">'+r.name+(sel?' ✓':'')+'</div><div style="font-size:11px;color:var(--ink3)">'+r.cuisine+' · '+r.time+' min</div>'+(ha?'<div style="font-size:11px;color:var(--red);margin-top:3px">⚠ '+hits.join(', ')+'</div>':'')+'</div>';}).join('');
}
function resetAMForm(day,recipeId){
  amDay=day||DAYS[0];amRecipe=recipeId||null;amType='Dinner';amMode='recipe';amIngN=0;
  gr('am-search').value='';
  if(gr('am-manual'))gr('am-manual').value='';
  if(gr('am-manual-time'))gr('am-manual-time').value='';
  if(gr('am-ingredients'))gr('am-ingredients').innerHTML='';
  if(gr('am-note'))gr('am-note').value='';
  if(gr('mt-inline-panel'))gr('mt-inline-panel').style.display='none';
  if(gr('mt-toggle-btn'))gr('mt-toggle-btn').textContent='⚙ Customise';
  renderAMD();renderAMT();renderAMMode();renderAML();
}
function openAM(day){resetAMForm(day,null);openM('modal-am');}
function openAMForR(id){resetAMForm(DAYS[0],id);openM('modal-am');}
function renderAMMode(){
  var el=gr('am-mode');if(el)el.innerHTML=['recipe','manual'].map(function(m){return'<button class="tchip'+(amMode===m?' on':'')+'" onclick="setAMMode(\''+m+'\')">'+(m==='recipe'?'From recipes':'Manual')+'</button>';}).join('');
  if(gr('am-recipe-panel'))gr('am-recipe-panel').style.display=amMode==='recipe'?'block':'none';
  if(gr('am-manual-panel'))gr('am-manual-panel').style.display=amMode==='manual'?'block':'none';
}
function setAMMode(mode){amMode=mode;amRecipe=null;if(mode==='manual'&&gr('am-ingredients')&&!gr('am-ingredients').children.length)addAMIngredient();renderAMMode();renderAML();}
function selAMR(id){amRecipe=id;amMode='recipe';renderAMMode();renderAML();}
function addAMIngredient(name,qty,unit){
  amIngN++;var div=document.createElement('div');div.className='ingrow';div.id='am-ing-'+amIngN;
  div.innerHTML='<input class="fi" style="flex:2;padding:9px 10px;font-size:13px" placeholder="Ingredient" value="'+escHtml(name||'')+'"/>'+
    '<input type="number" step="0.25" min="0" class="fi" style="width:65px;flex:0 0 65px;padding:9px 8px;font-size:13px" placeholder="Qty" value="'+(qty||'')+'"/>'+
    '<select class="fi" style="flex:1;padding:9px 8px;font-size:13px">'+UNITS.map(function(u){return'<option value="'+u+'"'+(u===(unit||'')?' selected':'')+'>'+(u||'—')+'</option>';}).join('')+'</select>'+
    '<button class="btn btns btnd" onclick="this.parentElement.remove()" style="flex-shrink:0;padding:9px 10px">✕</button>';
  gr('am-ingredients').appendChild(div);
}
function collectAMIngredients(){
  var rows=gr('am-ingredients')?Array.from(gr('am-ingredients').querySelectorAll('.ingrow')):[];
  return rows.map(function(row){
    var inputs=row.querySelectorAll('input'),sel=row.querySelector('select');
    var name=inputs[0]?inputs[0].value.trim():'';
    if(!name)return null;
    var qty=parseFloat(inputs[1]?inputs[1].value:'');
    return{name:name,qty:qty>0?qty:1,unit:sel?sel.value:''};
  }).filter(Boolean);
}
function confirmAM(){
  var k=planKey(amDay);if(!plan[k])plan[k]=[];
  var note=(gr('am-note')?gr('am-note').value.trim():'');
  var meal={id:newId('meal'),mealType:amType,updatedAt:Date.now()};
  if(amMode==='manual'){
    var manual=(gr('am-manual')?gr('am-manual').value.trim():'');
    if(!manual){showToast('Add a meal name');return;}
    meal.manualName=manual;
    var tm=parseInt(gr('am-manual-time')?gr('am-manual-time').value:'',10);
    if(tm>0)meal.manualTime=tm;
    var ingredients=collectAMIngredients();
    if(ingredients.length)meal.manualIngredients=ingredients;
  }else{
    if(!amRecipe){showToast('Pick a recipe first');return;}
    meal.recipeId=typeof amRecipe==='string'?parseInt(amRecipe,10):amRecipe;
  }
  if(note)meal.note=note;
  plan[k].push(meal);closeM('modal-am');renderPlanner();renderShop();renderDashboard();persist('plan',k);showToast('Added to '+amDay);
}

// ADD/EDIT RECIPE
function openRecipeAddChoice(){openM('modal-recipe-add');}
function startManualRecipe(){closeM('modal-recipe-add');openAddRecipe(null);}
function openImportModal(mode){
  closeM('modal-recipe-add');
  switchIT(mode||'url');
  gr('import-result').innerHTML='';
  gr('import-loading').style.display='none';
  openM('modal-import');
}
function startImportRecipe(mode){openImportModal(mode||'url');}
function openAddRecipe(pf){
  editId=null;nrDiets=[];nrAllergens=[];nrAppliances=[];ingN=0;stepN=0;nrImgB64='';
  gr('ar-title').textContent='New Recipe';
  gr('nr-name').value=pf?pf.name||'':'';gr('nr-desc').value=pf?pf.desc||'':'';gr('nr-time').value=pf?pf.time||30:30;
  gr('nr-servings').value=pf&&pf.servings?pf.servings:4;
  nrRating=pf&&pf.rating?pf.rating:0;
  gr('nr-url').value=pf?pf.source_url||'':'';
  if(gr('nr-notes'))gr('nr-notes').value=pf&&pf.notes?pf.notes:'';
  var sel=gr('nr-cuisine');sel.innerHTML=CUISINES.filter(function(c){return c!=='Any'}).map(function(c){return'<option>'+c+'</option>'}).join('');
  if(pf&&pf.cuisine)try{sel.value=pf.cuisine;}catch(e){}
  nrDiets=pf&&pf.diets?pf.diets.slice():[];nrAllergens=pf&&pf.allergens?pf.allergens.slice():[];nrAppliances=pf&&pf.appliances?pf.appliances.slice():[];
  renderNRD();renderNRA();renderNRApps();renderNRStars();gr('nr-ings').innerHTML='';gr('nr-steps').innerHTML='';
  renderNRImg(pf&&pf.image?pf.image:'');
  if(pf&&pf.ingredients&&pf.ingredients.length)pf.ingredients.forEach(function(i){addIR(i.name,i.qty,i.unit);});
  else{addIR();addIR();addIR();}
  if(pf&&pf.steps&&pf.steps.length)pf.steps.forEach(function(s){addSR(s);});
  else{addSR();addSR();}
  openM('modal-ar');
}
function openEditR(id){
  var r=rec(id);if(!r)return;editId=id;nrDiets=r.diets.slice();nrAllergens=r.allergens.slice();nrAppliances=(r.appliances&&r.appliances.length?r.appliances:getRecipeAppliances(r)).slice();ingN=0;stepN=0;nrImgB64=r.image||'';
  gr('ar-title').textContent='Edit Recipe';
  gr('nr-name').value=r.name;gr('nr-desc').value=r.desc||'';gr('nr-time').value=r.time||30;
  gr('nr-servings').value=r.servings||4;
  nrRating=r.rating||0;
  gr('nr-url').value=r.source_url||'';
  if(gr('nr-notes'))gr('nr-notes').value=r.notes||'';
  var sel=gr('nr-cuisine');sel.innerHTML=CUISINES.filter(function(c){return c!=='Any'}).map(function(c){return'<option>'+c+'</option>'}).join('');
  try{sel.value=r.cuisine;}catch(e){}
  renderNRD();renderNRA();renderNRApps();renderNRStars();gr('nr-ings').innerHTML='';gr('nr-steps').innerHTML='';
  renderNRImg(r.image||'');
  r.ingredients.forEach(function(i){addIR(i.name,i.qty,i.unit);});
  if(r.steps&&r.steps.length)r.steps.forEach(function(s){addSR(s);});
  else{addSR();addSR();}
  openM('modal-ar');
}
function renderNRD(){gr('nr-diets').innerHTML=DIETS.map(function(d){return'<button class="tchip'+(nrDiets.indexOf(d)>=0?' on':'')+'" onclick="togND(\''+d+'\')">'+d+'</button>'}).join('');}
function renderNRA(){gr('nr-allergens').innerHTML=ALLERGENS.map(function(a){return'<button class="tchip al'+(nrAllergens.indexOf(a)>=0?' on':'')+'" onclick="togNA(\''+a+'\')">'+a+'</button>'}).join('');}
function renderNRApps(){var el=gr('nr-appliances');if(!el)return;el.innerHTML=ALL_APPLIANCES.map(function(ap){return'<button class="app-chip'+(nrAppliances.indexOf(ap.id)>=0?' on':'')+'" onclick="togNApp(\''+ap.id+'\')">'+ap.emoji+' '+ap.name+'</button>'}).join('');}
function togND(d){nrDiets=nrDiets.indexOf(d)>=0?nrDiets.filter(function(x){return x!==d}):nrDiets.concat(d);renderNRD();}
function togNA(a){nrAllergens=nrAllergens.indexOf(a)>=0?nrAllergens.filter(function(x){return x!==a}):nrAllergens.concat(a);renderNRA();}
function togNApp(id){nrAppliances=nrAppliances.indexOf(id)>=0?nrAppliances.filter(function(x){return x!==id}):nrAppliances.concat(id);renderNRApps();}
function renderNRStars(){
  var el=gr('nr-stars');if(!el)return;
  el.innerHTML='';
  for(var i=1;i<=5;i++){
    var s=document.createElement('span');
    s.className='star'+(i<=nrRating?' on':'');
    s.textContent='★';
    (function(v){s.addEventListener('click',function(){nrRating=(nrRating===v)?0:v;renderNRStars();});})(i);
    el.appendChild(s);
  }
  var lbl=document.createElement('span');
  lbl.style.cssText='font-size:12px;color:var(--ink3);margin-left:8px';
  lbl.textContent=nrRating?['★ Poor','★★ OK','★★★ Good','★★★★ Great','★★★★★ Excellent'][nrRating-1]:'Tap to rate';
  el.appendChild(lbl);
}
function addIR(name,qty,unit){
  ingN++;var id='ing-'+ingN;var div=document.createElement('div');div.className='ingrow';div.id=id;
  div.innerHTML='<input class="fi" style="flex:2;padding:9px 10px;font-size:13px" placeholder="Ingredient" value="'+(name||'')+'"/>'+
    '<input type="number" step="0.25" min="0" class="fi" style="width:65px;flex:0 0 65px;padding:9px 8px;font-size:13px" placeholder="Qty" value="'+(qty||'')+'"/>'+
    '<select class="fi" style="flex:1;padding:9px 8px;font-size:13px">'+UNITS.map(function(u){return'<option value="'+u+'"'+(u===(unit||'')?' selected':'')+'>'+( u||'—')+'</option>'}).join('')+'</select>'+
    '<button class="btn btns btnd" onclick="this.parentElement.remove()" style="flex-shrink:0;padding:9px 10px">✕</button>';
  gr('nr-ings').appendChild(div);
}
function addSR(text){
  stepN++;var n=stepN;var div=document.createElement('div');div.className='step-input-row';
  var badge=document.createElement('div');badge.className='step-n-badge';badge.textContent=n;
  var ta=document.createElement('textarea');
  ta.className='fi';ta.style.cssText='flex:1;height:72px;resize:none;font-size:13px;line-height:1.5';
  ta.placeholder='Describe step '+n+'…';
  if(text)ta.value=text;
  var rmBtn=document.createElement('button');rmBtn.className='btn btns btnd';rmBtn.style.cssText='flex-shrink:0;padding:8px 10px;align-self:flex-start;margin-top:4px';rmBtn.textContent='✕';
  rmBtn.addEventListener('click',function(){div.remove();});
  div.appendChild(badge);div.appendChild(ta);div.appendChild(rmBtn);
  gr('nr-steps').appendChild(div);
}
var nrImgB64='';
function handleNRImg(e){
  var file=e.target.files[0];if(!file)return;
  // Resize to max 800px wide before storing to keep base64 size manageable
  var reader=new FileReader();
  reader.onload=function(ev){
    var img=new Image();
    img.onload=function(){
      var MAX=800;var w=img.width,h=img.height;
      if(w>MAX){h=Math.round(h*(MAX/w));w=MAX;}
      var canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
      canvas.getContext('2d').drawImage(img,0,0,w,h);
      nrImgB64=canvas.toDataURL('image/jpeg',0.82).split(',')[1];
      renderNRImg(nrImgB64);
    };
    img.src=ev.target.result;
  };
  reader.readAsDataURL(file);
}
function renderNRImg(b64){
  var wrap=gr('nr-img-wrap');var btn=gr('nr-img-btn');
  if(!b64){wrap.innerHTML='';btn.style.display='flex';return;}
  btn.style.display='none';
  wrap.innerHTML='<div class="img-preview-wrap"><img src="data:image/jpeg;base64,'+b64+'"/><button class="img-remove-btn" onclick="removeNRImg()">✕</button></div>';
}
function removeNRImg(){nrImgB64='';renderNRImg('');}
function saveRecipe(){
  var name=gr('nr-name').value.trim();if(!name){showToast('Please enter a name');return;}
  var ings=[].slice.call(gr('nr-ings').querySelectorAll('.ingrow')).map(function(row){var inp=row.querySelectorAll('input,select');return{name:inp[0].value.trim(),qty:parseFloat(inp[1].value)||1,unit:inp[2].value};}).filter(function(i){return i.name;});
  var steps=[].slice.call(gr('nr-steps').querySelectorAll('textarea')).map(function(t){return t.value.trim();}).filter(Boolean);
  var oldR=editId?rec(editId):null;
  var obj={id:editId?parseInt(editId,10):Date.now(),name:name,cuisine:gr('nr-cuisine').value,diets:nrDiets.slice(),allergens:nrAllergens.slice(),appliances:nrAppliances.slice(),appliancesManual:true,time:parseInt(gr('nr-time').value)||30,servings:parseInt(gr('nr-servings').value)||4,desc:gr('nr-desc').value.trim(),ingredients:ings,steps:steps,image:nrImgB64||'',source_url:gr('nr-url').value.trim(),rating:nrRating||0,notes:gr('nr-notes')?gr('nr-notes').value.trim():'',cookCount:oldR?oldR.cookCount||0:0,updatedAt:Date.now()};
  if(editId){var idx=recipes.findIndex(function(r){return r.id===editId});if(idx>=0)recipes[idx]=obj;else recipes.push(obj);}
  else recipes.push(obj);
  closeM('modal-ar');persist('recipes');renderAll();showToast(editId?'Recipe updated':'Recipe saved');
}

// ─── IMPORT ───────────────────────────────────────────────────────────────────

// STOCK
function stockSectionName(id){var s=STOCK_SECTIONS.find(function(x){return x.id===id;});return s?s.name:id;}
function normaliseStockTemplate(item){
  item=item&&typeof item==='object'?item:{};
  var base=normaliseStockItem(item);
  return{id:item.id||newId('tpl'),name:base.name,section:base.section,type:base.type,qty:base.qty||1,targetQty:base.targetQty,notes:base.notes,kit:base.kit,makeTime:base.makeTime,expiry:base.expiry,batch:base.batch,alert1:base.alert1,alert2:base.alert2,notify:!!base.notify,updatedAt:parseInt(item.updatedAt,10)||Date.now(),updatedBy:item.updatedBy||item.who||''};
}
function ensureDefaultStockTemplates(){
  DEFAULT_STOCK_TEMPLATES.forEach(function(tpl){
    var deleted=stockTemplateDeletes[String(tpl.id)];
    var exists=stockTemplates.some(function(t){
      return String(t.id)===String(tpl.id)||(stockNameKey(t.name)===stockNameKey(tpl.name)&&t.section===tpl.section&&stockNameKey(t.type)===stockNameKey(tpl.type));
    });
    if(!deleted&&!exists)stockTemplates.push(normaliseStockTemplate(tpl));
  });
}
function normaliseActivity(row){
  if(!row||typeof row!=='object')return null;
  var label=String(row.label||'').trim();
  if(!label)return null;
  return{id:row.id||newId('act'),label:label,detail:String(row.detail||'').trim(),kind:String(row.kind||'stock'),ts:parseInt(row.ts,10)||Date.now(),who:String(row.who||'').trim(),clientId:row.clientId||''};
}
function normaliseChecklistItem(item){
  if(!item||typeof item!=='object')return null;
  var text=String(item.text||'').trim();
  if(!text)return null;
  return{id:item.id||newId('nb'),text:text,done:!!item.done,deleted:!!item.deleted,order:parseInt(item.order,10)||0,updatedAt:parseInt(item.updatedAt,10)||Date.now(),updatedBy:item.updatedBy||item.who||''};
}
function addActivity(label,detail,kind){
  var row=normaliseActivity({id:newId('act'),label:label,detail:detail||'',kind:kind||'stock',ts:Date.now(),who:fbCfg.who||'Someone',clientId:fbClientId});
  activityLog=mergeActivityLogs([row],activityLog);
  saveL('activityLog',activityLog);
}
function normaliseStockVariants(list){
  return (Array.isArray(list)?list:[]).map(function(v,i){
    if(typeof v==='string')v={name:v,qty:0};
    var name=String(v&&v.name||'').trim();
    if(!name)return null;
    return{id:v.id||newId('var'),name:name,qty:Math.max(0,parseInt(v.qty,10)||0),order:parseInt(v.order,10)||i};
  }).filter(Boolean);
}
function normaliseStockItem(item){
  item=item&&typeof item==='object'?item:{};
  function alertVal(v){if(v===undefined||v===null||v==='')return null;var n=parseInt(v,10);return isNaN(n)||n<0?null:n;}
  var a1=alertVal(item.alert1),a2=alertVal(item.alert2);
  if(a1!==null&&a2!==null&&a2>a1){var tmp=a1;a1=a2;a2=tmp;}
  var variants=normaliseStockVariants(item.variants);
  var variantTotal=variants.reduce(function(s,v){return s+v.qty;},0);
  var qty=Math.max(0,parseInt(item.qty,10)||0);
  if(variants.length)qty=variantTotal;
  var target=item.targetQty===undefined||item.targetQty===null||item.targetQty===''?null:Math.max(0,parseInt(item.targetQty,10)||0);
  return{id:item.id||newId('stock'),name:String(item.name||'').trim(),section:item.section||'snack',type:String(item.type||'').trim(),qty:qty,targetQty:target,variants:variants,notes:String(item.notes||'').trim(),kit:String(item.kit||item.kitchenItems||'').trim(),makeTime:String(item.makeTime||'').trim(),expiry:String(item.expiry||'').trim(),batch:String(item.batch||item.batchLabel||'').trim(),image:String(item.image||'').trim(),usage:Array.isArray(item.usage)?item.usage.slice(-20):[],alert1:a1,alert2:a2,notify:!!item.notify,recipeId:item.recipeId||null,updatedAt:parseInt(item.updatedAt,10)||Date.now(),updatedBy:item.updatedBy||item.who||''};
}
function sortedStockItems(){return stockItems.map(normaliseStockItem).filter(function(i){return i.name;}).sort(function(a,b){return a.name.localeCompare(b.name);});}
function stockNameKey(name){return String(name||'').toLowerCase().replace(/\s+/g,' ').trim();}
function findSimilarStockItems(name,excludeId){
  var key=stockNameKey(name);
  if(!key)return[];
  return stockItems.map(normaliseStockItem).filter(function(item){
    if(excludeId&&String(item.id)===String(excludeId))return false;
    var ik=stockNameKey(item.name);
    return ik===key||ik.indexOf(key)>=0||key.indexOf(ik)>=0;
  }).slice(0,4);
}
function renderStockDuplicateHint(prefix,excludeId){
  var input=gr(prefix+'-name'),hint=gr(prefix+'-dupe-hint');
  if(!input||!hint)return;
  var matches=findSimilarStockItems(input.value,excludeId);
  if(!matches.length){hint.style.display='none';hint.innerHTML='';return;}
  hint.style.display='block';
  hint.innerHTML='<strong>Similar stock exists:</strong> '+matches.map(function(i){return escHtml(i.name)+' ('+i.qty+' left)';}).join(', ')+'<div style="margin-top:4px">Use Duplicate on an existing item if this is a flavour or variant.</div>';
}
function stockAlertLevel(item){
  item=normaliseStockItem(item);
  if(item.alert2!==null&&item.qty<=item.alert2)return 2;
  if(item.alert1!==null&&item.qty<=item.alert1)return 1;
  return 0;
}
function isStockLow(item){item=normaliseStockItem(item);return stockAlertLevel(item)>0||item.qty<=1;}
function requestStockNotificationPermission(){
  if(!('Notification' in window))return Promise.resolve(false);
  if(Notification.permission==='granted')return Promise.resolve(true);
  if(Notification.permission==='denied')return Promise.resolve(false);
  return Notification.requestPermission().then(function(p){return p==='granted';}).catch(function(){return false;});
}
function showStockNotification(item,level){
  item=normaliseStockItem(item);
  var title=level===2?'Urgent stock alert':'Stock running low';
  var body=item.name+' has '+item.qty+' left'+(level===2?' (2nd alert)':' (1st alert)');
  showToast(body);
  if(!item.notify||!('Notification' in window)||Notification.permission!=='granted')return;
  try{new Notification(title,{body:body,tag:'stock-'+item.id+'-'+level});}catch(e){}
}
function checkStockAlert(item){
  item=normaliseStockItem(item);
  var level=stockAlertLevel(item);
  var prev=stockAlertState[item.id]||0;
  if(level>prev)showStockNotification(item,level);
  stockAlertState[item.id]=level;
  saveL('stockAlertState',stockAlertState);
}
function checkAllStockAlerts(){stockItems.map(normaliseStockItem).forEach(checkStockAlert);}
function daysUntil(dateStr){
  if(!dateStr)return null;
  var d=new Date(dateStr+'T00:00:00');if(isNaN(d.getTime()))return null;
  var today=new Date();today.setHours(0,0,0,0);
  return Math.ceil((d.getTime()-today.getTime())/86400000);
}
function isStockExpiring(item){var d=daysUntil(normaliseStockItem(item).expiry);return d!==null&&d<=7;}
function stockRestockNeed(item){item=normaliseStockItem(item);return item.targetQty!==null&&item.targetQty>item.qty?item.targetQty-item.qty:0;}
function parseVariantText(text){
  return String(text||'').split(/\n+/).map(function(line,i){
    line=line.trim();if(!line)return null;
    var parts=line.split(':');
    var name=parts.shift().trim();
    var qty=parts.length?parseInt(parts.join(':').trim(),10):0;
    return{name:name,qty:Math.max(0,qty||0),order:i};
  }).filter(Boolean);
}
function variantText(vars){
  return normaliseStockVariants(vars).sort(function(a,b){return a.order-b.order;}).map(function(v){return v.name+': '+v.qty;}).join('\n');
}
function resizeImageFile(file,cb){
  if(!file)return;
  var reader=new FileReader();
  reader.onload=function(ev){
    var img=new Image();
    img.onload=function(){
      var max=700,w=img.width,h=img.height;
      if(w>max){h=Math.round(h*(max/w));w=max;}
      if(h>max){w=Math.round(w*(max/h));h=max;}
      var canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
      canvas.getContext('2d').drawImage(img,0,0,w,h);
      cb(canvas.toDataURL('image/jpeg',0.78).split(',')[1]);
    };
    img.src=ev.target.result;
  };
  reader.readAsDataURL(file);
}
function handleStockImg(e){var file=e.target.files[0];if(!file)return;resizeImageFile(file,function(b64){stockImgB64=b64;renderStockImg(b64);});}
function renderStockImg(b64){
  var wrap=gr('st-img-wrap');if(!wrap)return;
  if(!b64){wrap.innerHTML='';return;}
  wrap.innerHTML='<div class="stock-img-wrap"><img src="data:image/jpeg;base64,'+b64+'"/><button class="img-remove-btn" onclick="removeStockImg()">x</button></div>';
}
function removeStockImg(){stockImgB64='';renderStockImg('');}
function renderStockTabs(){var el=gr('stock-tabs');if(!el)return;var tabs=[{id:'all',name:'All'},{id:'low',name:'Low'},{id:'recent',name:'Recent'}].concat(STOCK_SECTIONS);el.innerHTML=tabs.map(function(t){return'<button class="tchip'+(stockFilter===t.id?' on':'')+'" onclick="setStockFilter(\''+t.id+'\')">'+t.name+'</button>';}).join('');}
function setStockFilter(id){stockFilter=id;renderStock();}
function updateStockItem(item,label,detail){
  item.updatedAt=Date.now();item.updatedBy=fbCfg.who||'Someone';
  var norm=normaliseStockItem(item);
  var idx=stockItems.findIndex(function(x){return String(x.id)===String(norm.id);});
  if(idx>=0)stockItems[idx]=norm;
  if(label)addActivity(label,detail||'', 'stock');
  persist('stockItems',{type:'update',item:norm});checkStockAlert(norm);renderStock();renderDashboard();
}
function stockQty(id,delta,reason){
  var item=stockItems.find(function(x){return String(x.id)===String(id);});if(!item)return;
  item=normaliseStockItem(item);
  if(item.variants.length){
    var variant=delta<0?item.variants.find(function(v){return v.qty>0;}):item.variants[0];
    if(variant){stockVariantQty(id,variant.id,delta,reason);return;}
  }
  var before=parseInt(item.qty,10)||0;item.qty=Math.max(0,before+delta);
  if(delta<0){item.usage=(Array.isArray(item.usage)?item.usage:[]).concat([{ts:Date.now(),qty:Math.abs(delta),reason:reason||'Used',who:fbCfg.who||'Someone'}]).slice(-20);}
  var norm=normaliseStockItem(item);
  updateStockItem(norm,(delta<0?(reason||'Used')+' ':'Added ')+Math.abs(delta)+' '+norm.name,norm.qty+' left');
}
function stockVariantQty(id,varId,delta,reason){
  var item=stockItems.find(function(x){return String(x.id)===String(id);});if(!item)return;
  item=normaliseStockItem(item);
  var v=item.variants.find(function(x){return String(x.id)===String(varId);});if(!v)return;
  v.qty=Math.max(0,v.qty+delta);
  if(delta<0)item.usage=(item.usage||[]).concat([{ts:Date.now(),qty:Math.abs(delta),reason:(reason||'Used')+' '+v.name,who:fbCfg.who||'Someone'}]).slice(-20);
  var norm=normaliseStockItem(item);
  updateStockItem(norm,(delta<0?(reason||'Used')+' ':'Added ')+Math.abs(delta)+' '+norm.name+' - '+v.name,norm.qty+' total left');
}
function openUseStockModal(id){
  var item=stockItems.find(function(x){return String(x.id)===String(id);});if(!item)return;
  stockUseId=id;gr('use-stock-name').textContent=normaliseStockItem(item).name;openM('modal-stock-use');
}
function confirmUseStock(reason){if(!stockUseId)return;stockQty(stockUseId,-1,reason);closeM('modal-stock-use');stockUseId=null;}
function restockStock(id){
  var item=stockItems.find(function(x){return String(x.id)===String(id);});if(!item)return;
  item=normaliseStockItem(item);
  if(item.targetQty===null){showToast('Set a usual target quantity first');openStockModal(id);return;}
  var need=item.targetQty-item.qty;if(need<=0){showToast('Already at usual quantity');return;}
  if(item.variants.length)item.variants[0].qty+=need;
  else item.qty=item.targetQty;
  updateStockItem(item,'Restocked '+item.name,'Back to '+item.targetQty);
  showToast('Restocked to usual');
}
function stockCard(item){
  item=normaliseStockItem(item);
  var card=document.createElement('div');card.className='stock-card'+(isStockLow(item)?' low':'');
  if(item.image){var img=document.createElement('img');img.className='stock-photo';img.src='data:image/jpeg;base64,'+item.image;img.alt=item.name;card.appendChild(img);}
  var name=document.createElement('div');name.className='stock-name';name.textContent=item.name;card.appendChild(name);
  var meta=document.createElement('div');meta.className='stock-meta';var bits=[stockSectionName(item.section)];if(item.type)bits.push(item.type);if(item.section==='freezer'&&item.makeTime)bits.push(item.makeTime);if(item.targetQty!==null)bits.push('usual '+item.targetQty);if(item.batch)bits.push(item.batch);if(item.expiry){var d=daysUntil(item.expiry);bits.push(d===null?item.expiry:(d<0?'expired':d===0?'use today':'use in '+d+'d'));}meta.textContent=bits.join(' - ');card.appendChild(meta);
  var level=stockAlertLevel(item);
  if(level){var alert=document.createElement('div');alert.className='stock-alert';alert.textContent=(level===2?'2nd alert':'1st alert')+' - '+item.qty+' left';card.appendChild(alert);}
  if(isStockExpiring(item)){var exp=document.createElement('div');exp.className='stock-alert';exp.textContent='Use soon';card.appendChild(exp);}
  if(item.kit){var kit=document.createElement('div');kit.className='stock-note';kit.textContent='Needs: '+item.kit;card.appendChild(kit);}
  if(item.notes){var notes=document.createElement('div');notes.className='stock-note';notes.textContent=item.notes;card.appendChild(notes);}
  if(item.variants.length){var vl=document.createElement('div');vl.className='variant-list';item.variants.sort(function(a,b){return a.order-b.order;}).forEach(function(v){var vr=document.createElement('div');vr.className='variant-row';var vn=document.createElement('div');vn.className='variant-name';vn.textContent=v.name;var vd=document.createElement('button');vd.className='srv-btn';vd.textContent='-';vd.addEventListener('click',function(){stockVariantQty(item.id,v.id,-1);});var vp=document.createElement('div');vp.className='qty-pill';vp.textContent=v.qty;var vu=document.createElement('button');vu.className='srv-btn';vu.textContent='+';vu.addEventListener('click',function(){stockVariantQty(item.id,v.id,1);});vr.appendChild(vn);vr.appendChild(vd);vr.appendChild(vp);vr.appendChild(vu);vl.appendChild(vr);});card.appendChild(vl);}
  var row=document.createElement('div');row.style.cssText='display:flex;align-items:center;gap:8px;justify-content:space-between';
  var qty=document.createElement('div');qty.className='qty-step';
  var dn=document.createElement('button');dn.className='srv-btn';dn.textContent='-';dn.addEventListener('click',function(){stockQty(item.id,-1);});
  var pill=document.createElement('div');pill.className='qty-pill';pill.textContent=item.qty;
  var up=document.createElement('button');up.className='srv-btn';up.textContent='+';up.addEventListener('click',function(){stockQty(item.id,1);});
  qty.appendChild(dn);qty.appendChild(pill);qty.appendChild(up);
  var acts=document.createElement('div');acts.style.cssText='display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end';
  var edit=document.createElement('button');edit.className='btn btns';edit.textContent='Edit';edit.addEventListener('click',function(){openStockModal(item.id);});
  var use=document.createElement('button');use.className='btn btns btnp';use.textContent='Use';use.addEventListener('click',function(){openUseStockModal(item.id);});
  var restock=document.createElement('button');restock.className='btn btns';restock.textContent='Restock';restock.addEventListener('click',function(){restockStock(item.id);});
  var dup=document.createElement('button');dup.className='btn btns btndup';dup.textContent='Duplicate';dup.addEventListener('click',function(){duplicateStockItem(item.id);});
  var tpl=document.createElement('button');tpl.className='btn btns';tpl.textContent='Template';tpl.addEventListener('click',function(){saveStockTemplate(item.id);});
  var del=document.createElement('button');del.className='btn btns btnd';del.textContent='Delete';del.addEventListener('click',function(){deleteStock(item.id);});
  acts.appendChild(use);acts.appendChild(restock);acts.appendChild(edit);acts.appendChild(dup);acts.appendChild(tpl);acts.appendChild(del);row.appendChild(qty);row.appendChild(acts);card.appendChild(row);
  return card;
}
function renderStockTemplateStrip(){
  var el=gr('stock-template-strip');if(!el)return;
  if(!stockTemplates.length){el.innerHTML='';return;}
  el.innerHTML='<button class="tchip" onclick="openQuickStockModal(null)">+ Quick add</button>'+stockTemplates.slice().sort(function(a,b){return a.name.localeCompare(b.name);}).slice(0,12).map(function(t){return'<button class="tchip" onclick="openQuickStockModal(\''+escHtml(t.id)+'\')">'+escHtml(t.name)+'</button><button class="tchip" title="Remove template" onclick="deleteStockTemplate(\''+escHtml(t.id)+'\')">x</button>';}).join('');
}
function renderStock(){
  renderStockTabs();
  renderStockTemplateStrip();
  var el=gr('stock-list');if(!el)return;
  var s=gr('stock-search')?gr('stock-search').value.toLowerCase():'';
  var items=sortedStockItems().filter(function(i){
    if(stockFilter==='low'&&!isStockLow(i))return false;
    if(stockFilter!=='recent'&&['all','low'].indexOf(stockFilter)<0&&i.section!==stockFilter)return false;
    if(s&&[i.name,i.type,i.notes,i.kit].join(' ').toLowerCase().indexOf(s)<0)return false;
    return true;
  });
  if(stockFilter==='recent')items=items.sort(function(a,b){return b.updatedAt-a.updatedAt;});
  el.innerHTML='';
  if(!items.length){el.innerHTML='<div class="empty"><div class="empty-icon">Stock</div><div class="empty-text">No stock items yet</div></div>';return;}
  var layout=document.createElement('div');layout.className='alpha-layout';var list=document.createElement('div');var letters=[];
  items.forEach(function(item){var l=firstLetter(item.name);if(letters.indexOf(l)<0){letters.push(l);var a=document.createElement('div');a.id='stock-letter-'+l;a.className='letter-anchor';list.appendChild(a);}list.appendChild(stockCard(item));});
  layout.appendChild(list);addAlphaRail(layout,letters,'stock-letter-');el.appendChild(layout);
}
function renderStockSectionPicker(section){var el=gr('st-section');if(!el)return;el.innerHTML=STOCK_SECTIONS.map(function(s){return'<button class="tchip'+(section===s.id?' on':'')+'" onclick="pickStockSection(\''+s.id+'\')">'+s.name+'</button>';}).join('');el.setAttribute('data-value',section);}
function pickStockSection(id){renderStockSectionPicker(id);}
function renderQuickStockSectionPicker(section){var el=gr('qs-section');if(!el)return;stockQuickSection=section||'snack';el.innerHTML=STOCK_SECTIONS.map(function(s){return'<button class="tchip'+(stockQuickSection===s.id?' on':'')+'" onclick="pickQuickStockSection(\''+s.id+'\')">'+s.name+'</button>';}).join('');}
function pickQuickStockSection(id){stockQuickSection=id;renderQuickStockSectionPicker(id);}
function renderQuickStockTemplates(){
  var el=gr('qs-templates');if(!el)return;
  if(!stockTemplates.length){el.innerHTML='';return;}
  el.innerHTML=stockTemplates.slice().sort(function(a,b){return a.name.localeCompare(b.name);}).slice(0,10).map(function(t){return'<button class="tchip" onclick="applyStockTemplate(\''+escHtml(t.id)+'\')">'+escHtml(t.name)+'</button><button class="tchip" title="Remove template" onclick="deleteStockTemplate(\''+escHtml(t.id)+'\')">x</button>';}).join('');
}
function applyStockTemplate(id){
  var t=stockTemplates.find(function(x){return String(x.id)===String(id);});if(!t)return;
  t=normaliseStockTemplate(t);
  stockQuickSection=t.section||'snack';renderQuickStockSectionPicker(stockQuickSection);
  gr('qs-name').value=t.name||'';gr('qs-type').value=t.type||'';gr('qs-qty').value=t.qty||1;gr('qs-target').value=t.targetQty!==null&&t.targetQty!==undefined?t.targetQty:'';gr('qs-time').value=t.makeTime||'';gr('qs-expiry').value=t.expiry||'';gr('qs-batch').value=t.batch||'';gr('qs-alert1').value=t.alert1!==null&&t.alert1!==undefined?t.alert1:'';gr('qs-alert2').value=t.alert2!==null&&t.alert2!==undefined?t.alert2:'';gr('qs-notify').checked=!!t.notify;gr('qs-kit').value=t.kit||'';gr('qs-notes').value=t.notes||'';renderStockDuplicateHint('qs');
}
function openQuickStockModal(templateId){
  var section=['all','low','recent'].indexOf(stockFilter)>=0?'snack':stockFilter;
  stockQuickSection=section||'snack';renderQuickStockSectionPicker(stockQuickSection);renderQuickStockTemplates();
  ['qs-name','qs-type','qs-target','qs-time','qs-expiry','qs-batch','qs-alert1','qs-alert2','qs-kit','qs-notes'].forEach(function(id){if(gr(id))gr(id).value='';});
  gr('qs-qty').value=1;gr('qs-notify').checked=false;gr('qs-template').checked=false;gr('qs-more').style.display='none';renderStockDuplicateHint('qs');
  openM('modal-stock-quick');if(templateId)applyStockTemplate(templateId);
}
function toggleQuickStockMore(){var el=gr('qs-more');el.style.display=el.style.display==='block'?'none':'block';}
function openStockModal(id){
  stockEditId=id||null;
  var item=id?stockItems.find(function(x){return String(x.id)===String(id);}):null;
  item=item?normaliseStockItem(item):{section:['all','low','recent'].indexOf(stockFilter)>=0?'snack':stockFilter,qty:1};
  gr('stock-title').textContent=id?'Edit stock item':'New stock item';
  stockImgB64=item.image||'';
  gr('st-name').value=item.name||'';gr('st-type').value=item.type||'';gr('st-qty').value=item.qty===0?0:(item.qty||1);gr('st-target').value=item.targetQty!==null&&item.targetQty!==undefined?item.targetQty:'';gr('st-time').value=item.makeTime||'';gr('st-expiry').value=item.expiry||'';gr('st-batch').value=item.batch||'';gr('st-alert1').value=item.alert1!==null&&item.alert1!==undefined?item.alert1:'';gr('st-alert2').value=item.alert2!==null&&item.alert2!==undefined?item.alert2:'';gr('st-notify').checked=!!item.notify;gr('st-variants').value=variantText(item.variants);renderStockImg(stockImgB64);gr('st-kit').value=item.kit||'';gr('st-notes').value=item.notes||'';
  renderStockDuplicateHint('st',stockEditId);
  renderStockSectionPicker(item.section||'snack');openM('modal-stock');
}
function saveQuickStockItem(){
  var name=gr('qs-name').value.trim();if(!name){showToast('Add a stock name');return;}
  var item=normaliseStockItem({id:newId('stock'),name:name,section:stockQuickSection,type:gr('qs-type').value,qty:gr('qs-qty').value,targetQty:gr('qs-target').value,makeTime:gr('qs-time').value,expiry:gr('qs-expiry').value,batch:gr('qs-batch').value,alert1:gr('qs-alert1').value,alert2:gr('qs-alert2').value,notify:gr('qs-notify').checked,kit:gr('qs-kit').value,notes:gr('qs-notes').value,updatedAt:Date.now(),updatedBy:fbCfg.who||'Someone'});
  stockItems.push(item);
  if(gr('qs-template').checked)upsertStockTemplate(item,false);
  addActivity('Added '+item.name,item.qty+' in '+stockSectionName(item.section),'stock');
  function finish(){closeM('modal-stock-quick');persist('stockItems',{type:'update',item:item});checkStockAlert(item);renderStock();renderDashboard();showToast('Stock added');}
  if(item.notify&&(item.alert1!==null||item.alert2!==null))setupClosedStockNotifications(false).then(finish);else finish();
}
function saveStockItem(){
  var name=gr('st-name').value.trim();if(!name){showToast('Add a stock name');return;}
  var item=normaliseStockItem({id:stockEditId||newId('stock'),name:name,section:gr('st-section').getAttribute('data-value')||'snack',type:gr('st-type').value,qty:gr('st-qty').value,targetQty:gr('st-target').value,makeTime:gr('st-time').value,expiry:gr('st-expiry').value,batch:gr('st-batch').value,variants:parseVariantText(gr('st-variants').value),image:stockImgB64,alert1:gr('st-alert1').value,alert2:gr('st-alert2').value,notify:gr('st-notify').checked,kit:gr('st-kit').value,notes:gr('st-notes').value,updatedAt:Date.now(),updatedBy:fbCfg.who||'Someone'});
  var idx=stockItems.findIndex(function(x){return String(x.id)===String(item.id);});
  if(idx>=0)stockItems[idx]=item;else stockItems.push(item);
  addActivity((idx>=0?'Updated ':'Added ')+item.name,item.qty+' left','stock');
  function finish(){closeM('modal-stock');persist('stockItems',{type:'update',item:item});checkStockAlert(item);renderStock();renderDashboard();showToast('Stock saved');}
  if(item.notify&&(item.alert1!==null||item.alert2!==null))setupClosedStockNotifications(false).then(finish);else finish();
}
function deleteStock(id,skipConfirm){
  if(!skipConfirm&&!confirm('Delete this stock item?'))return;
  var existing=stockItems.find(function(x){return String(x.id)===String(id);});
  var ts=Date.now();
  stockItems=stockItems.filter(function(x){return String(x.id)!==String(id);});
  stockDeletes[String(id)]=ts;
  delete stockAlertState[String(id)];saveL('stockAlertState',stockAlertState);
  addActivity('Deleted '+(existing?existing.name:'stock item'),'Removed from stock','stock');
  persist('stockItems',{type:'remove',id:id,deletedAt:ts});
  renderStock();renderDashboard();
  showToast('Stock deleted',existing?function(){
    delete stockDeletes[String(id)];
    stockItems.push(existing);
    addActivity('Restored '+existing.name,'Undo delete','stock');
    persist('stockItems',{type:'update',item:existing});
    renderStock();renderDashboard();showToast('Stock restored');
  }:null);
}
function duplicateStockItem(id){
  var item=stockItems.find(function(x){return String(x.id)===String(id);});if(!item)return;
  item=normaliseStockItem(item);
  var copy=normaliseStockItem(Object.assign({},item,{id:newId('stock'),name:item.name+' - ',qty:item.qty||1,updatedAt:Date.now(),updatedBy:fbCfg.who||'Someone'}));
  stockItems.push(copy);addActivity('Duplicated '+item.name,'New variant ready to rename','stock');persist('stockItems',{type:'update',item:copy});renderStock();renderDashboard();openStockModal(copy.id);showToast('Stock duplicated');
}
function upsertStockTemplate(item,toast){
  item=normaliseStockTemplate(item);
  var key=stockNameKey(item.name)+'|'+item.section+'|'+stockNameKey(item.type);
  var idx=stockTemplates.findIndex(function(t){return stockNameKey(t.name)+'|'+t.section+'|'+stockNameKey(t.type)===key;});
  item.id=idx>=0?stockTemplates[idx].id:(item.id&&String(item.id).indexOf('tpl')===0?item.id:newId('tpl'));
  item.updatedAt=Date.now();item.updatedBy=fbCfg.who||'Someone';
  if(idx>=0)stockTemplates[idx]=item;else stockTemplates.push(item);
  if(toast!==false)showToast('Template saved');
  return item;
}
function saveStockTemplate(id){
  var item=stockItems.find(function(x){return String(x.id)===String(id);});if(!item)return;
  var template=upsertStockTemplate(item,true);addActivity('Saved template '+item.name,'Available in quick add','template');persist('stockTemplates',{type:'update',item:template});renderStock();renderDashboard();
}
function deleteStockTemplate(id){
  var tpl=stockTemplates.find(function(t){return String(t.id)===String(id);});if(!tpl)return;
  if(!confirm('Remove this stock template?'))return;
  var ts=Date.now();
  stockTemplates=stockTemplates.filter(function(t){return String(t.id)!==String(id);});
  stockTemplateDeletes[String(id)]=ts;
  addActivity('Removed template '+tpl.name,'Quick add template removed','template');
  persist('stockTemplates',{type:'remove',id:id,deletedAt:ts});
  renderStock();renderQuickStockTemplates();renderDashboard();showToast('Template removed');
}
function openRecipeStockModal(id){
  var r=rec(id);if(!r)return;
  recipeStockId=id;
  gr('rs-name').value=r.name;
  gr('rs-qty').value=r.servings||4;
  gr('rs-time').value=(r.time||'')?(r.time+' min'):'';
  var apps=(r.appliances&&r.appliances.length?r.appliances:getRecipeAppliances(r)).map(function(apId){var ap=ALL_APPLIANCES.find(function(a){return a.id===apId;});return ap?ap.name:apId;});
  gr('rs-kit').value=apps.join(', ');
  gr('rs-alert1').value=3;gr('rs-alert2').value=1;gr('rs-notify').checked=false;
  gr('rs-notes').value='Batch cooked from recipe';
  openM('modal-recipe-stock');
}
function saveRecipeStockBatch(){
  var name=gr('rs-name').value.trim();if(!name){showToast('Add a freezer stock name');return;}
  var item=normaliseStockItem({id:newId('stock'),name:name,section:'freezer',type:'meal',qty:gr('rs-qty').value,makeTime:gr('rs-time').value,alert1:gr('rs-alert1').value,alert2:gr('rs-alert2').value,notify:gr('rs-notify').checked,kit:gr('rs-kit').value,notes:gr('rs-notes').value,recipeId:recipeStockId,updatedAt:Date.now(),updatedBy:fbCfg.who||'Someone'});
  stockItems.push(item);
  addActivity('Added freezer batch '+item.name,item.qty+' portions','stock');
  function finish(){closeM('modal-recipe-stock');persist('stockItems',{type:'update',item:item});checkStockAlert(item);renderStock();renderDashboard();showToast('Freezer stock added');}
  if(item.notify&&(item.alert1!==null||item.alert2!==null))setupClosedStockNotifications(false).then(finish);else finish();
}
function renderMiniStock(el,items,emptyText){
  if(!el)return;
  if(!items.length){el.innerHTML='<div style="font-size:13px;color:var(--ink3);padding:4px 0">'+emptyText+'</div>';return;}
  el.innerHTML='';var wrap=document.createElement('div');wrap.className='mini-stock-list';
  items.forEach(function(item){item=normaliseStockItem(item);var row=document.createElement('div');row.className='mini-stock-row'+(isStockLow(item)?' low':'');var name=document.createElement('div');name.className='mini-stock-name';name.textContent=item.name+' · '+stockSectionName(item.section);var dn=document.createElement('button');dn.className='srv-btn';dn.textContent='-';dn.addEventListener('click',function(){stockQty(item.id,-1);});var pill=document.createElement('div');pill.className='qty-pill';pill.textContent=item.qty;var up=document.createElement('button');up.className='srv-btn';up.textContent='+';up.addEventListener('click',function(){stockQty(item.id,1);});row.appendChild(name);row.appendChild(dn);row.appendChild(pill);row.appendChild(up);wrap.appendChild(row);});
  el.appendChild(wrap);
}
function stockNeedsForShopping(){
  return sortedStockItems().filter(function(item){return isStockLow(item)||stockRestockNeed(item)>0||isStockExpiring(item);}).sort(function(a,b){return stockAlertLevel(b)-stockAlertLevel(a)||stockRestockNeed(b)-stockRestockNeed(a)||a.name.localeCompare(b.name);});
}
function renderShoppingNeeds(el){
  if(!el)return;
  var needs=stockNeedsForShopping();
  if(!needs.length){el.innerHTML='<div style="font-size:13px;color:var(--ink3);padding:4px 0">No stock needs buying right now</div>';return;}
  renderMiniStock(el,needs.slice(0,6),'No stock needs buying right now');
}
function addLowStockToExtras(){
  var needs=stockNeedsForShopping();
  if(!needs.length){showToast('Nothing low to add');return;}
  var added=[];
  needs.forEach(function(item){
    var label=item.name;
    if(extraItems.indexOf(label)<0){extraItems.push(label);added.push(label);}
  });
  if(added.length){addActivity('Added low stock to shopping',added.length+' item'+(added.length===1?'':'s')+' added','shopping');persist('extraItems',{type:'add',items:added});renderShop();renderDashboard();showToast('Added to shopping');}
  else showToast('Already on shopping list');
}
function renderActivityFeed(el){
  if(!el)return;
  var rows=activityLog.map(normaliseActivity).filter(Boolean).sort(function(a,b){return b.ts-a.ts;}).slice(0,6);
  if(!rows.length){el.innerHTML='<div style="font-size:13px;color:var(--ink3);padding:4px 0">No shared changes yet</div>';return;}
  el.innerHTML='';
  rows.forEach(function(row){
    var div=document.createElement('div');div.className='activity-row';
    div.appendChild(mkEl('div','activity-main',row.label));
    var meta=[row.who||'Someone',fmtDate(row.ts)];
    if(row.detail)meta.push(row.detail);
    div.appendChild(mkEl('div','activity-meta',meta.join(' - ')));
    el.appendChild(div);
  });
}
function renderStatusCard(){
  var el=gr('dash-status');if(!el)return;
  var latest=activityLog.map(normaliseActivity).filter(Boolean).sort(function(a,b){return b.ts-a.ts;})[0];
  var sync=fbConn?'Live sync active':'Not synced';
  var detail=fbConn?(fbCfg.who?'Connected as '+fbCfg.who:'Connected'):'Tap the cloud button to connect both phones';
  if(latest)detail+=' - latest change '+fmtDate(latest.ts);
  el.innerHTML='<div class="status-card"><div class="status-main">'+escHtml(sync)+'</div><div class="status-sub">'+escHtml(detail)+'</div></div>';
  var btn=gr('sleepy-toggle');if(btn)btn.className='btn btns sleepy-toggle'+(sleepyMode?' on':'');
}
function dashboardActions(){
  var actions=[];
  var urgent=sortedStockItems().filter(function(i){return stockAlertLevel(i)===2;});
  var low=sortedStockItems().filter(function(i){return stockAlertLevel(i)===1;});
  var exp=sortedStockItems().filter(isStockExpiring);
  var restock=sortedStockItems().filter(function(i){return stockRestockNeed(i)>0;});
  var today=dashboardPlanDay(0).meals;
  if(urgent.length)actions.push(urgent.length+' urgent stock item'+(urgent.length===1?'':'s')+' need attention');
  if(low.length)actions.push(low.length+' stock item'+(low.length===1?' is':'s are')+' running low');
  if(exp.length)actions.push(exp[0].name+' needs using soon');
  if(restock.length)actions.push(restock.length+' item'+(restock.length===1?'':'s')+' below usual quantity');
  if(!today.length)actions.push('No meals planned today');
  return actions.slice(0,6);
}
function renderActionList(el){
  if(!el)return;
  var actions=dashboardActions();
  if(!actions.length){el.innerHTML='<div style="font-size:13px;color:var(--ink3);padding:4px 0">Nothing pressing right now</div>';return;}
  el.innerHTML='<div class="action-list">'+actions.map(function(a){return'<div class="action-row">'+escHtml(a)+'</div>';}).join('')+'</div>';
}
function renderPartnerChanges(el){
  if(!el)return;
  var rows=activityLog.map(normaliseActivity).filter(function(row){return row&&row.ts>lastActivitySeen&&row.clientId&&row.clientId!==fbClientId;}).sort(function(a,b){return b.ts-a.ts;}).slice(0,5);
  if(!rows.length){el.innerHTML='<div style="font-size:13px;color:var(--ink3);padding:4px 0">No unseen partner changes</div>';return;}
  el.innerHTML='';
  rows.forEach(function(row){
    var div=document.createElement('div');div.className='activity-row';
    div.appendChild(mkEl('div','activity-main',row.label));
    div.appendChild(mkEl('div','activity-meta',(row.who||'Partner')+' - '+fmtDate(row.ts)+(row.detail?' - '+row.detail:'')));
    el.appendChild(div);
  });
}
function renderDashboardPlannedMeals(el){
  if(!el)return;
  el.innerHTML='';
  [dashboardPlanDay(0),dashboardPlanDay(1)].forEach(function(group){
    var wrap=document.createElement('div');
    wrap.style.cssText='margin-bottom:10px';
    var label=document.createElement('div');
    label.style.cssText='font-size:11px;font-weight:700;text-transform:uppercase;color:var(--ink3);margin-bottom:6px';
    label.textContent=group.label+' - '+group.day;
    wrap.appendChild(label);
    if(!group.meals.length){
      var empty=document.createElement('div');
      empty.style.cssText='font-size:13px;color:var(--ink3);padding:4px 0';
      empty.textContent='No meals planned';
      wrap.appendChild(empty);
    }else{
      group.meals.forEach(function(m){
        var row=document.createElement('div');
        row.className='mini-stock-row';
        row.innerHTML='<div class="mini-stock-name">'+escHtml(m.mealType||'Meal')+' - '+escHtml(mealDisplayName(m))+'</div>';
        wrap.appendChild(row);
      });
    }
    el.appendChild(wrap);
  });
}
function markActivitySeen(){lastActivitySeen=Date.now();saveL('lastActivitySeen',lastActivitySeen);renderDashboard();showToast('Changes marked seen');}
function toggleSleepyMode(){sleepyMode=!sleepyMode;saveL('sleepyMode',sleepyMode);document.body.classList.toggle('sleepy',sleepyMode);renderDashboard();showToast(sleepyMode?'Sleepy Mode on':'Sleepy Mode off');}
function renderNewbornChecklist(el){
  if(!el)return;
  var rows=newbornChecklist.map(normaliseChecklistItem).filter(function(i){return i&&!i.deleted;}).sort(function(a,b){return a.order-b.order;});
  if(!rows.length){el.innerHTML='<div style="font-size:13px;color:var(--ink3);padding:4px 0">No checklist items yet</div>';return;}
  el.innerHTML='';
  rows.forEach(function(item){
    var row=document.createElement('div');row.className='check-row'+(item.done?' done':'');
    var box=document.createElement('div');box.className='check-box';box.textContent=item.done?'✓':'';box.addEventListener('click',function(){toggleNewbornChecklist(item.id);});
    var txt=document.createElement('div');txt.className='check-text';txt.textContent=item.text;
    var del=document.createElement('button');del.className='btn btns btnd';del.textContent='x';del.addEventListener('click',function(){deleteNewbornChecklistItem(item.id);});
    row.appendChild(box);row.appendChild(txt);row.appendChild(del);el.appendChild(row);
  });
}
function toggleNewbornChecklist(id){
  var item=newbornChecklist.find(function(x){return String(x.id)===String(id);});if(!item)return;
  item.done=!item.done;item.updatedAt=Date.now();item.updatedBy=fbCfg.who||'Someone';
  addActivity((item.done?'Checked ':'Reopened ')+item.text,'Newborn checklist','newborn');
  persist('newbornChecklist',{type:'update',item:normaliseChecklistItem(item)});renderDashboard();
}
function addNewbornChecklistItem(){
  var text=prompt('Checklist item');if(!text||!text.trim())return;
  var item=normaliseChecklistItem({id:newId('nb'),text:text.trim(),done:false,order:newbornChecklist.length,updatedAt:Date.now(),updatedBy:fbCfg.who||'Someone'});
  newbornChecklist.push(item);addActivity('Added checklist item '+item.text,'Newborn checklist','newborn');persist('newbornChecklist',{type:'update',item:item});renderDashboard();
}
function deleteNewbornChecklistItem(id){
  var item=newbornChecklist.find(function(x){return String(x.id)===String(id);});if(!item)return;
  if(!confirm('Remove this checklist item?'))return;
  item.deleted=true;item.updatedAt=Date.now();item.updatedBy=fbCfg.who||'Someone';
  addActivity('Removed checklist item '+item.text,'Newborn checklist','newborn');persist('newbornChecklist',{type:'update',item:normaliseChecklistItem(item)});renderDashboard();
}
function renderDashboard(){
  var stats=gr('dash-stats');if(!stats)return;
  renderStatusCard();
  var wp=getWeekPlanForOffset(0);var meals=Object.values(wp).reduce(function(s,a){return s+(a?a.length:0);},0);var low=stockItems.filter(isStockLow).length;var freezer=stockItems.filter(function(i){return normaliseStockItem(i).section==='freezer';}).length;
  stats.innerHTML='';
  [[meals,'Meals'],[stockItems.length,'Stock'],[low,'Low'],[freezer,'Freezer']].forEach(function(x){
    var c=mkEl('div','stat-card');
    var numEl=mkEl('div','stat-n','0');c.appendChild(numEl);c.appendChild(mkEl('div','stat-l',x[1]));stats.appendChild(c);
    countUp(numEl,x[0],600);
  });
  renderDashboardPlannedMeals(gr('dash-planned'));
  renderActionList(gr('dash-actions'));
  var quick=stockNeedsForShopping().slice(0,4);
  if(!quick.length)quick=stockItems.map(normaliseStockItem).sort(function(a,b){return b.updatedAt-a.updatedAt;}).slice(0,4);
  renderMiniStock(gr('dash-3am-stock'),quick,'No stock yet - quick add your staples');
  renderShoppingNeeds(gr('dash-shopping-needs'));
  renderMiniStock(gr('dash-low-stock'),sortedStockItems().filter(isStockLow).slice(0,5),'Nothing low right now');
  renderMiniStock(gr('dash-recent-stock'),stockItems.map(normaliseStockItem).sort(function(a,b){return b.updatedAt-a.updatedAt;}).slice(0,5),'No stock added yet');
  renderActivityFeed(gr('dash-activity'));
  renderPartnerChanges(gr('dash-partner-changes'));
}

var iMode='url';var imgB64='';var imgMime='';var importedData=null;

function switchIT(m){
  iMode=m;
  ['url','img','paste'].forEach(function(t){
    gr('itab-'+(t==='img'?'img':t==='paste'?'paste':'url')).className='itab'+(m===(t==='img'?'image':t)?' on':'');
    gr('ip-'+(t==='img'?'img':t)).style.display=m===(t==='img'?'image':t)?'block':'none';
  });
  gr('import-result').innerHTML='';
  gr('import-loading').style.display='none';
}

/**
 * Robustly extract a JSON object from any AI response string.
 * Handles:
 *  - Plain JSON
 *  - ```json ... ``` fences (Claude, ChatGPT)
 *  - ``` ... ``` plain fences
 *  - JSON embedded in prose (finds first { ... } block)
 *  - Windows line endings (\r\n)
 *  - Leading/trailing whitespace of any kind
 */
function extractJSON(raw) {
  if (!raw || !raw.trim()) throw new Error('Empty input');

  // Normalise line endings
  var text = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 1. Strip <think>...</think> blocks (Gemini 2.5 Flash thinking mode)
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // 2. Try stripping code fences (```json or ```) from start and end
  var fenced = text.replace(/^\s*```(?:json)?\s*\n?/, '').replace(/\n?\s*```\s*$/, '').trim();
  try { var p = JSON.parse(fenced); if (p && typeof p === 'object') return p; } catch(e) {}

  // 3. Try the raw text trimmed as-is
  try { var p2 = JSON.parse(text.trim()); if (p2 && typeof p2 === 'object') return p2; } catch(e) {}

  // 4. Find the first { ... } block in the text (handles JSON embedded in prose)
 var start = text.indexOf('{');

if (start !== -1) {
  var candidate = text.slice(start);

  var opens = (candidate.match(/\{/g) || []).length;
  var closes = (candidate.match(/\}/g) || []).length;

  if (opens > closes) {
    candidate += new Array(opens - closes + 1).join('}');
  }

  try {
    var p3 = JSON.parse(candidate);
    if (p3 && typeof p3 === 'object') return p3;
  } catch(e) {}
}

  // 5. Nothing worked — throw with a preview of what we received
  throw new Error('Could not parse recipe from Gemini response. Received: ' + text.substring(0, 120));
}
function isUsableRecipeResponse(text) {
  if (!text || !text.trim()) return false;
  try{
    var data = extractJSON(text);
    return Boolean(
      data.name &&
      Array.isArray(data.ingredients) &&
      data.ingredients.length > 0 &&
      Array.isArray(data.steps) &&
      data.steps.length > 0
  );
  } catch(e){
    return false;
  }
}

function processImport(text) {
  gr('import-loading').style.display = 'none';
  console.log ('RAW IMPORT RESPONSE');
  console.log(text);
  if (!text || !text.trim()) { showToast('Nothing to import'); return; }

  var data;
  try {
    data = extractJSON(text);
  } catch(e) {
    var preview = (text || '').substring(0, 200);
    gr('import-result').innerHTML =
      '<div class="rc-warn" style="flex-direction:column;gap:4px">' +
      '<div style="font-weight:600">⚠ Could not read recipe data</div>' +
      '<div style="font-size:12px;line-height:1.5">Gemini returned something unexpected. Please try again.</div>' +
      '<details style="margin-top:6px"><summary style="font-size:11px;color:var(--red);cursor:pointer">Show raw response</summary>' +
      '<code style="font-size:10px;word-break:break-all;display:block;margin-top:4px;background:var(--red-p);padding:6px;border-radius:4px;white-space:pre-wrap">' + escHtml(preview) + '</code>' +
      '</details>' +
      '</div>';
    return;
  }

  if (!data.name) {
    gr('import-result').innerHTML = '<div class="rc-warn"><span>⚠</span><span>JSON parsed but no recipe name found. Check the response format.</span></div>';
    return;
  }

  importedData = data;
  var div = document.createElement('div');
  div.className = 'rcard';
  div.style.cssText = 'background:var(--sage-p);border-color:var(--sage)';
  div.innerHTML =
    '<div style="font-size:11px;font-weight:500;color:var(--sage);margin-bottom:8px">✓ Recipe extracted!</div>' +
    '<div class="rc-name">' + escHtml(data.name) + '</div>' +
    '<div class="rc-meta">' + escHtml(data.cuisine || '?') + ' · ' + (data.time || '?') + ' min · ' + (data.ingredients || []).length + ' ingredients · ' + (data.steps || []).length + ' steps</div>' +
    (data.desc ? '<div style="font-size:13px;color:var(--ink2);margin:8px 0">' + escHtml(data.desc) + '</div>' : '') +
    '<div style="font-size:12px;color:var(--ink2);margin-top:8px"><strong>Ingredients preview:</strong> ' +
    escHtml((data.ingredients || []).slice(0, 6).map(function(i){ return i.name; }).join(', ') + ((data.ingredients && data.ingredients.length > 6) ? '…' : '')) +
    '</div>';
  var btn = document.createElement('button');
  btn.className = 'btn btnf btnp';
  btn.style.marginTop = '10px';
  btn.textContent = '＋ Add to my recipes';
  btn.addEventListener('click', function(){ saveImported(); });
  div.appendChild(btn);
  gr('import-result').innerHTML = '';
  gr('import-result').appendChild(div);
}

function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function saveImported(){
  if(!importedData){showToast('No recipe to save');return;}
  closeM('modal-import');openAddRecipe(importedData);importedData=null;
  gr('import-result').innerHTML='';
  gr('img-preview').innerHTML='';gr('img-preview').style.display='none';
  imgB64='';imgMime='';
}

// Wire up all buttons after DOM ready
function initImportButtons(){

  gr('url-copy-btn').addEventListener('click', function(){
    var url = gr('url-input').value.trim();
    var prompt = 'Extract the recipe from this URL: '+(url||'[paste URL here]')+'\n\nReturn ONLY a raw JSON object with no markdown, no explanation, no code fences:\n'+
      '{"name":"","cuisine":"Italian","diets":[],"allergens":[],"time":30,"servings":4,"desc":"","source_url":"","ingredients":[{"name":"","qty":1,"unit":"g"}],"steps":["Step 1 instruction"]}\n\n'+
      'Cuisine: Italian/Mexican/Asian/Indian/Mediterranean/British/American/Japanese/Thai/French\n'+
      'Diets: Vegan/Vegetarian/Pescatarian/Gluten-free/Dairy-free/Halal\n'+
      'Allergens: Gluten/Dairy/Nuts/Eggs/Fish/Shellfish/Soya/Sesame/Celery/Mustard\n'+
      'Units: g/kg/ml/l/tsp/tbsp/cup/oz/lb or empty string for whole items.\n'+
      'source_url: set to the original recipe page URL if known, otherwise empty string.\n'+
      'Rewrite the method as concise original/paraphrased steps. Respond with JSON only — no other text.';
    showPromptBox(prompt);
  });

  function showPromptBox(prompt){
    var existing=gr('prompt-overlay');if(existing)existing.remove();
    var ov=document.createElement('div');ov.id='prompt-overlay';
    ov.style.cssText='position:fixed;inset:0;background:rgba(15,26,15,0.85);z-index:500;display:flex;flex-direction:column;align-items:stretch;padding:20px;box-sizing:border-box;padding-top:calc(env(safe-area-inset-top,0px) + 20px);padding-bottom:calc(env(safe-area-inset-bottom,0px) + 20px)';
    var title=document.createElement('div');title.style.cssText='color:#fff;font-family:\'Playfair Display\',serif;font-size:18px;margin-bottom:6px';title.textContent='Copy this prompt';
    var sub=document.createElement('div');sub.style.cssText='color:#a0b4a0;font-size:13px;margin-bottom:14px;line-height:1.5';sub.textContent='Hold your finger on the text below → Select All → Copy, then paste into Claude.ai or ChatGPT';
    var ta=document.createElement('textarea');
    ta.style.cssText='flex:1;background:#1a2e1a;color:#d4e8cc;border:2px solid var(--sage);border-radius:12px;padding:14px;font-size:13px;font-family:monospace;line-height:1.5;resize:none;-webkit-user-select:text;user-select:text';
    ta.readOnly=true;ta.value=prompt;
    var closeBtn=document.createElement('button');
    closeBtn.style.cssText='margin-top:14px;padding:14px;background:var(--sage);color:#fff;border:none;border-radius:10px;font-size:16px;font-weight:600;font-family:\'DM Sans\',sans-serif;cursor:pointer';
    closeBtn.textContent='Done';
    closeBtn.addEventListener('click',function(){ov.remove();});
    ov.appendChild(title);ov.appendChild(sub);ov.appendChild(ta);ov.appendChild(closeBtn);
    document.body.appendChild(ov);
    setTimeout(function(){ta.focus();ta.setSelectionRange(0,ta.value.length);},100);
  }

  gr('url-json-btn').addEventListener('click', function(){ processImport(gr('json-paste-url').value.trim()); });
  gr('img-json-btn').addEventListener('click', function(){ processImport(gr('json-paste-img').value.trim()); });
  gr('text-json-btn').addEventListener('click', function(){ processImport(gr('json-paste-text').value.trim()); });
}

function handleImg(e) {
  var file = e.target.files[0];
  if (!file) return;

  var reader = new FileReader();

  reader.onload = function(ev) {
    var image = new Image();

    image.onload = function() {
      var maxSize = 1600;
      var scale = Math.min(1, maxSize / Math.max(image.width, image.height));

      var canvas = document.createElement('canvas');
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);

      var context = canvas.getContext('2d');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      var resizedImage = canvas.toDataURL('image/jpeg', 0.82);

      imgB64 = resizedImage.split(',')[1];
      imgMime = 'image/jpeg';

      var preview = gr('img-preview');
      preview.style.display = 'block';
      preview.innerHTML = '';

      var img = document.createElement('img');
      img.src = resizedImage;
      img.style.cssText = 'width:100%;border-radius:10px;margin-bottom:10px;max-height:220px;object-fit:cover;display:block';

      var btn = document.createElement('button');
      btn.className = 'btn btnf btnp';
      btn.textContent = 'Extract with Gemini';
      btn.addEventListener('click', function() {
        extractImg();
      });

      preview.appendChild(img);
      preview.appendChild(btn);
    };

    image.src = ev.target.result;
  };

  reader.readAsDataURL(file);
}

async function extractImg(){
  if(!imgB64){showToast('Please select an image first');return;}
  if(!API_KEY){showAPIKeyPrompt();return;}
  gr('import-loading').style.display='block';gr('import-result').innerHTML='';
  try{
    // FIX: Images must NOT use responseSchema — it conflicts with vision requests in Gemini.
    // Use callGeminiVision which sends no schema and relies on extractJSON parser.
    var prompt='Extract the recipe from this image. Return ONLY a raw JSON object — no markdown, no code fences, no explanation:\n'+
      '{"name":"","cuisine":"British","diets":[],"allergens":[],"time":30,"servings":4,"desc":"","source_url":"",'+
      '"ingredients":[{"name":"","qty":1,"unit":"g"}],"steps":["Step 1 instruction"]}\n\n'+
      'For cookbook pages, do not transcribe or closely reproduce the method wording. Extract the factual ingredient quantities, then write concise original cooking steps in your own words. '+
      'Cuisine: Italian/Mexican/Asian/Indian/Mediterranean/British/American/Japanese/Thai/French. '+
      'Diets: Vegan/Vegetarian/Pescatarian/Gluten-free/Dairy-free/Halal. '+
      'Allergens: Gluten/Dairy/Nuts/Eggs/Fish/Shellfish/Soya/Sesame/Celery/Mustard. '+
      'Units: g/kg/ml/l/tsp/tbsp/cup/oz/lb or empty string for whole items. '+
      'Include the full cooking flow as paraphrased steps. source_url: empty string for images. Return JSON only.';
    var parts=[
      {inline_data:{mime_type:imgMime,data:imgB64}},
      {text:prompt}
    ];
    var result=await callGeminiVision(parts);
    processImport(result);
  }catch(e){
    if(e.code==='RECITATION'){
      try{
        gr('import-result').innerHTML='<div style="background:var(--warm-p);border:1.5px solid var(--warm);border-radius:var(--r);padding:12px 14px;font-size:13px;color:#5a3a10;margin-bottom:10px">Gemini stopped to avoid reproducing cookbook wording. Trying again with a shorter original adaptation...</div>';
        var fallbackPrompt='The image shows a cookbook recipe. Create a concise, original adaptation from the visible facts. Do not quote or closely reproduce the source wording. Return ONLY valid JSON with this structure:\n'+
          '{"name":"","cuisine":"British","diets":[],"allergens":[],"time":30,"servings":4,"desc":"","source_url":"",'+
          '"ingredients":[{"name":"","qty":1,"unit":"g"}],"steps":["Concise original step"]}\n\n'+
          'Keep ingredient quantities where visible. Write the method as short paraphrased steps in your own words. Return JSON only.';
        var fallbackParts=[
          {inline_data:{mime_type:imgMime,data:imgB64}},
          {text:fallbackPrompt}
        ];
        var fallbackResult=await callGeminiVision(fallbackParts);
        processImport(fallbackResult);
        return;
      }catch(e2){
        e=e2;
      }
    }
    gr('import-loading').style.display='none';
    if(e.code==='RECITATION')e.message='Gemini stopped to avoid reproducing protected recipe wording. Try pasting a shorter ingredient list plus your own summary of the method.';
    if(e.message!=='No API key')gr('import-result').innerHTML='<div class="rc-warn"><span>⚠</span><span>'+escHtml(e.message)+'</span></div>';
  }
}

async function importURL(){
  var url=gr('url-input').value.trim();if(!url){showToast('Paste a URL first');return;}
  if(!API_KEY){showAPIKeyPrompt();return;}
  var extractBtn=gr('url-extract-btn');
  extractBtn.disabled=true;extractBtn.textContent='Extracting...';
  gr('import-loading').style.display='block';gr('import-result').innerHTML='';
  try{
    var prompt='Fetch and extract the recipe from this URL: '+url+'\n\n'+
      'Return ONLY a raw JSON object — no markdown, no code fences, no explanation:\n'+
      '{"name":"","cuisine":"British","diets":[],"allergens":[],"time":30,"servings":4,"desc":"","source_url":"'+url+'",'+
      '"ingredients":[{"name":"","qty":1,"unit":"g"}],"steps":["Step 1"]}\n\n'+
      'Cuisine: Italian/Mexican/Asian/Indian/Mediterranean/British/American/Japanese/Thai/French. '+
      'Diets: Vegan/Vegetarian/Pescatarian/Gluten-free/Dairy-free/Halal. '+
      'Allergens: Gluten/Dairy/Nuts/Eggs/Fish/Shellfish/Soya/Sesame/Celery/Mustard. '+
      'Units: g/kg/ml/l/tsp/tbsp/cup/oz/lb or empty string for whole items. '+
      'Summarise and paraphrase the cooking method into concise steps; do not quote the page verbatim. '+
      'Keep descriptions under 30 words. Return ONLY valid JSON.';

    var result;
    try{
      result=await callGeminiWithURL([{text:prompt}]);
    }catch(fetchError){
      if(fetchError.code!=='RECITATION')throw fetchError;
      gr('import-result').innerHTML =
        '<div style="background:var(--warm-p);border:1.5px solid var(--warm);border-radius:var(--r);padding:12px 14px;font-size:13px;color:#5a3a10;margin-bottom:10px">' +
        'Gemini could read the page but could not reproduce its wording. Creating a concise adaptation instead...</div>';
      var adaptationPrompt='Create a concise, original recipe adaptation based on the publicly available factual recipe information at this URL: '+url+'\n\n'+
        'Do not quote or closely reproduce the source wording. Use your own short cooking instructions. '+
        'Return ONLY a raw JSON object with this structure:\n'+
        '{"name":"","cuisine":"British","diets":[],"allergens":[],"time":30,"servings":4,"desc":"","source_url":"'+url+'",'+
        '"ingredients":[{"name":"","qty":1,"unit":"g"}],"steps":["Concise original step"]}\n\n'+
        'Preserve factual ingredient quantities when available. Use concise paraphrased steps. Return ONLY valid JSON.';
      result=await callGeminiWithURL([{text:adaptationPrompt}]);
    }

    // If url_context returned nothing (e.g. BBC Food blocks automated fetch),
    // fall back to asking Gemini from its training knowledge
    if (!isUsableRecipeResponse(result)) {
      gr('import-result').innerHTML =
        '<div style="background:var(--warm-p);border:1.5px solid var(--warm);border-radius:var(--r);padding:12px 14px;font-size:13px;color:#5a3a10;margin-bottom:10px">' +
        '⚠️ Couldn\'t fetch that page directly (it may block automated access). Trying from Gemini\'s knowledge instead…</div>';
      var fallbackPrompt = 'Extract the recipe from this URL using your training knowledge: '+url+'\n\n'+
        'Return ONLY a raw JSON object — no markdown, no code fences:\n'+
        '{"name":"","cuisine":"British","diets":[],"allergens":[],"time":30,"servings":4,"desc":"","source_url":"'+url+'",'+
        '"ingredients":[{"name":"","qty":1,"unit":"g"}],"steps":["Step 1"]}\n\n'+
        'Cuisine: Italian/Mexican/Asian/Indian/Mediterranean/British/American/Japanese/Thai/French. '+
        'Diets: Vegan/Vegetarian/Pescatarian/Gluten-free/Dairy-free/Halal. '+
        'Allergens: Gluten/Dairy/Nuts/Eggs/Fish/Shellfish/Soya/Sesame/Celery/Mustard. '+
        'Units: g/kg/ml/l/tsp/tbsp/cup/oz/lb or empty string. Summarise the method in your own words. Return ONLY valid JSON.';
      result = await callGeminiVision([{text:fallbackPrompt}]);
    }

    processImport(result);
  }catch(e){
    gr('import-loading').style.display='none';
    if(e.message!=='No API key'){
      var help=e.code==='RECITATION'
        ? 'Gemini could not import this page because the recipe text is protected or not published on the page. Try a photo of a recipe you own, or paste recipe text you can access.'
        : e.message;
      gr('import-result').innerHTML='<div class="rc-warn"><span>⚠</span><span>'+escHtml(help)+'</span></div>';
    }
  }finally{
    extractBtn.disabled=false;extractBtn.textContent='✨ Extract';
  }
}

async function importFromText(){
  var raw=gr('paste-text').value.trim();if(!raw){showToast('Paste some recipe text first');return;}
  if(!API_KEY){showAPIKeyPrompt();return;}
  var text=cleanSocialText(raw);
  gr('import-loading').style.display='block';gr('import-result').innerHTML='';
  try{
    var prompt='Extract the recipe from this text. Return ONLY this JSON structure — no markdown, no code fences:\n{"name":"","cuisine":"Italian","diets":[],"allergens":[],"time":30,"servings":4,"desc":"","source_url":"","ingredients":[{"name":"","qty":1,"unit":"g"}],"steps":["Step 1 instruction"]}\n\nCuisine: Italian/Mexican/Asian/Indian/Mediterranean/British/American/Japanese/Thai/French. Diets: Vegan/Vegetarian/Pescatarian/Gluten-free/Dairy-free/Halal. Allergens: Gluten/Dairy/Nuts/Eggs/Fish/Shellfish/Soya/Sesame/Celery/Mustard. Units: g/kg/ml/l/tsp/tbsp/cup/oz/lb or empty string for whole items. Extract factual ingredients and rewrite the method as concise original/paraphrased steps. Return JSON only — no markdown, no code fences. source_url: include if a URL appears in the text, otherwise empty string.\n\nRecipe text:\n'+text;
    var result=await callGemini([{text:prompt}]);
    processImport(result);
  }catch(e){
    gr('import-loading').style.display='none';
    if(e.code==='RECITATION')e.message='Gemini stopped to avoid reproducing protected recipe wording. Try pasting a shorter ingredient list plus your own summary of the method.';
    if(e.message!=='No API key')gr('import-result').innerHTML='<div class="rc-warn"><span>⚠</span><span>'+escHtml(e.message)+'</span></div>';
  }
}

function showPastePromptBox(prompt){
  // Reuse the same overlay pattern as URL copy prompt
  var existing=gr('prompt-overlay');if(existing)existing.remove();
  var ov=document.createElement('div');ov.id='prompt-overlay';
  ov.style.cssText='position:fixed;inset:0;background:rgba(15,26,15,0.85);z-index:500;display:flex;flex-direction:column;align-items:stretch;padding:20px;box-sizing:border-box;padding-top:calc(env(safe-area-inset-top,0px) + 20px);padding-bottom:calc(env(safe-area-inset-bottom,0px) + 20px)';
  var title=document.createElement('div');title.style.cssText='color:#fff;font-family:\'Playfair Display\',serif;font-size:18px;margin-bottom:6px';title.textContent='Copy this prompt';
  var sub=document.createElement('div');sub.style.cssText='color:#a0b4a0;font-size:13px;margin-bottom:14px;line-height:1.5';sub.textContent='Hold the text below → Select All → Copy, then paste into Claude.ai or ChatGPT. Paste the JSON response back in the box below.';
  var ta=document.createElement('textarea');
  ta.style.cssText='flex:1;background:#1a2e1a;color:#d4e8cc;border:2px solid var(--sage);border-radius:12px;padding:14px;font-size:12px;font-family:monospace;line-height:1.5;resize:none;-webkit-user-select:text;user-select:text';
  ta.readOnly=true;ta.value=prompt;
  var closeBtn=document.createElement('button');
  closeBtn.style.cssText='margin-top:14px;padding:14px;background:var(--sage);color:#fff;border:none;border-radius:10px;font-size:16px;font-weight:600;font-family:\'DM Sans\',sans-serif;cursor:pointer';
  closeBtn.textContent='Done — paste JSON in the box below';
  closeBtn.addEventListener('click',function(){ov.remove();});
  ov.appendChild(title);ov.appendChild(sub);ov.appendChild(ta);ov.appendChild(closeBtn);
  document.body.appendChild(ov);
  setTimeout(function(){ta.focus();ta.setSelectionRange(0,ta.value.length);},100);
}

// ─── GEMINI URL FETCH — uses url_context tool so Gemini fetches the page itself
async function callGeminiWithURL(parts) {
  if (!API_KEY) { showAPIKeyPrompt(); throw new Error('No API key'); }
  var model = 'gemini-2.5-flash';
  var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + API_KEY;
  var body = {
    contents: [{ role: 'user', parts: parts }],
    tools: [{ url_context: {} }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }
    // Note: responseSchema cannot be combined with tools in Gemini API
  };
  async function attempt() {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  }
  var resp = await attempt();
  if (!resp.ok) {
    var err = await resp.json().catch(function(){ return {}; });
    var msg = (err.error && err.error.message) || ('API error ' + resp.status);
    if (resp.status === 400 || resp.status === 403) msg = 'Invalid or expired API key — tap \'Change API key\' below to re-enter it.';
    if (resp.status === 429) msg = 'Gemini rate limit hit — please wait 30 seconds and try again.';
    // Handle "model is overloaded" gracefully
    if (resp.status === 503 || (msg && msg.toLowerCase().indexOf('overload') >= 0)) msg = 'Gemini is busy right now — please wait a moment and try again.';
    throw new Error(msg);
  }
  var data = await resp.json();
  // FIX: Gemini url_context returns multiple parts — concatenate ALL text parts
  var textParts = data.candidates && data.candidates[0] &&
                  data.candidates[0].content && data.candidates[0].content.parts;
  var text = '';
  if (textParts && Array.isArray(textParts)) {
    text = textParts
      .filter(function(p){ return p && typeof p.text === 'string'; })
      .map(function(p){ return p.text; })
      .join('\n');
  }
  // Check finish reason — RECITATION or other blocking reasons
  var finishReason = data.candidates && data.candidates[0] && data.candidates[0].finishReason;
  if (finishReason === 'RECITATION' || (!text && finishReason && finishReason !== 'STOP')) {
    var finishError=new Error('Gemini could not fetch this page (reason: ' + finishReason + ').');
    finishError.code=finishReason;
    throw finishError;
  }
  console.log('Gemini URL response — parts:', (textParts||[]).length, 'text length:', text.length);
  return text || '';
}

// ─── GEMINI VISION — for image imports (no responseSchema, works with inline_data) ─
async function callGeminiVision(parts) {
  if (!API_KEY) { showAPIKeyPrompt(); throw new Error('No API key'); }
  var model = 'gemini-2.5-flash';
  var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + API_KEY;
  var body = {
    contents: [{ role: 'user', parts: parts }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 4096 }
    // No responseSchema — combining schema with image parts causes Gemini to fail
  };
  async function attempt() {
    return fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
  }
  var resp = await attempt();
  if (!resp.ok) {
    var err = await resp.json().catch(function(){return{};});
    var msg = (err.error && err.error.message) || ('API error ' + resp.status);
    if (resp.status === 400 || resp.status === 403) msg = 'Invalid or expired API key — tap \'Change API key\' below.';
    if (resp.status === 429) msg = 'Gemini rate limit hit — please wait 30 seconds and try again.';
    if (resp.status === 503 || (msg && msg.toLowerCase().indexOf('overload') >= 0)) msg = 'Gemini is busy right now — please wait a moment and try again.';
    throw new Error(msg);
  }
  var data = await resp.json();
  var textParts = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts;
  var text = '';
  if (textParts && Array.isArray(textParts)) {
    text = textParts.filter(function(p){return p && typeof p.text==='string';}).map(function(p){return p.text;}).join('\n');
  }
  var finishReason = data.candidates && data.candidates[0] && data.candidates[0].finishReason;
  if (finishReason === 'RECITATION' || (!text && finishReason && finishReason !== 'STOP')) {
    var finishError=new Error('Gemini could not complete the import (reason: '+finishReason+').');
    finishError.code=finishReason;
    throw finishError;
  }
  return text || '';
}

// ─── GEMINI API ───────────────────────────────────────────────────────────────
// Handles both text-only and vision (image) requests.
// Surfaces quota errors immediately so one tap never consumes multiple requests.
async function callGemini(parts) {
  if (!API_KEY) { showAPIKeyPrompt(); throw new Error('No API key'); }
  var model = 'gemini-2.5-flash';
  var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + API_KEY;
  var body = {
    contents: [{ role: 'user', parts: parts }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 1500,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          name:        { type: 'string' },
          cuisine:     { type: 'string' },
          diets:       { type: 'array', items: { type: 'string' } },
          allergens:   { type: 'array', items: { type: 'string' } },
          time:        { type: 'number' },
          servings:    { type: 'number' },
          desc:        { type: 'string' },
          source_url:  { type: 'string' },
          ingredients: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                qty:  { type: 'number' },
                unit: { type: 'string' }
              },
              required: ['name', 'qty', 'unit']
            }
          },
          steps: { type: 'array', items: { type: 'string' } }
        },
        required: ['name', 'cuisine', 'diets', 'allergens', 'time', 'servings', 'desc', 'source_url', 'ingredients', 'steps']
      }
    }
  };
  async function attempt() {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  }
  var resp = await attempt();
  if (!resp.ok) {
    var err = await resp.json().catch(function(){ return {}; });
    var msg = (err.error && err.error.message) || ('API error ' + resp.status);
    if (resp.status === 400 || resp.status === 403) msg = 'Invalid or expired API key — tap \'Change API key\' below to re-enter it.';
    if (resp.status === 429) msg = 'Gemini rate limit hit — please wait 30 seconds and try again.';
    if (resp.status === 503 || (msg && msg.toLowerCase().indexOf('overload') >= 0)) msg = 'Gemini is busy right now — please wait a moment and try again.';
    throw new Error(msg);
  }
  var data = await resp.json();
  var text = data.candidates && data.candidates[0] &&
             data.candidates[0].content && data.candidates[0].content.parts &&
             data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
  var finishReason = data.candidates && data.candidates[0] && data.candidates[0].finishReason;
  if (finishReason === 'RECITATION' || (!text && finishReason && finishReason !== 'STOP')) {
    var finishError=new Error('Gemini could not complete the import (reason: '+finishReason+').');
    finishError.code=finishReason;
    throw finishError;
  }
  return text || '';
}

function showAPIKeyPrompt() {
  gr('import-result').innerHTML =
    '<div class="setup-card">' +
      '<div style="font-family:\'Playfair Display\',serif;font-size:16px;margin-bottom:10px">🔑 Add your Gemini API Key</div>' +
      '<p style="font-size:13px;color:var(--ink2);margin-bottom:14px;line-height:1.5">Free to use — no billing needed. You only need to enter this once.</p>' +
      '<div class="setup-step"><div class="setup-num">1</div><div style="font-size:13px;color:var(--ink2);line-height:1.5">Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color:var(--sage);font-weight:500">aistudio.google.com/app/apikey</a></div></div>' +
      '<div class="setup-step"><div class="setup-num">2</div><div style="font-size:13px;color:var(--ink2);line-height:1.5">Sign in with Google → tap <strong>Create API key</strong> → copy it</div></div>' +
      '<div class="setup-step"><div class="setup-num">3</div><div style="font-size:13px;color:var(--ink2);line-height:1.5">Paste it below — it starts with <strong>AIza</strong></div></div>' +
      '<input class="fi" id="api-key-input" placeholder="AIzaSy…" style="margin-bottom:10px"/>' +
      '<button class="btn btnf btnp" onclick="saveAPIKey()">Save API Key</button>' +
    '</div>';
}
function saveAPIKey() {
  var k = gr('api-key-input').value.trim();
  if (!k.startsWith('AIza')) { showToast('Gemini keys start with AIza…'); return; }
  API_KEY = k; saveL('apiKey', k);
  gr('import-result').innerHTML = '<div style="text-align:center;padding:16px;color:var(--sage);font-size:14px;font-weight:500">✓ API key saved! Try an import now.</div>';
  showToast('API key saved');
}

// PROFILE
function openProfile(){
  gr('prof-al').innerHTML=ALLERGENS.map(function(a){return'<button class="tchip al'+(userAllergens.indexOf(a)>=0?' on':'')+'" onclick="togPA(\''+a+'\')">'+a+'</button>';}).join('');
  gr('prof-di').innerHTML=DIETS.map(function(d){return'<button class="tchip'+(userDiet===d?' on':'')+'" onclick="togPD(\''+d+'\')">'+d+'</button>';}).join('');
  renderProfWeekStart();
  // Supermarket grid
  var smEl=gr('prof-sm');smEl.innerHTML='';
  SUPERMARKETS.forEach(function(sm){
    var btn=document.createElement('button');
    btn.className='sm-chip'+(userSupermarket===sm.id?' on':'');
    var nameSpan=document.createElement('span');nameSpan.className='sm-chip-name';nameSpan.textContent=sm.emoji+' '+sm.name;
    var tierSpan=document.createElement('span');tierSpan.className='sm-chip-tier';tierSpan.textContent=sm.tierLabel;
    btn.appendChild(nameSpan);btn.appendChild(tierSpan);
    (function(id){btn.addEventListener('click',function(){
      userSupermarket=id;
      smEl.querySelectorAll('.sm-chip').forEach(function(b){b.classList.remove('on');});
      btn.classList.add('on');
    });})(sm.id);
    smEl.appendChild(btn);
  });
  // Appliances
  var appEl=gr('prof-app');appEl.innerHTML='';
  ALL_APPLIANCES.forEach(function(ap){
    var btn=document.createElement('button');
    btn.className='app-chip'+(userAppliances.indexOf(ap.id)>=0?' on':'');
    btn.textContent=ap.emoji+' '+ap.name;
    (function(id,b){b.addEventListener('click',function(){
      var idx=userAppliances.indexOf(id);
      if(idx>=0)userAppliances.splice(idx,1);else userAppliances.push(id);
      b.className='app-chip'+(userAppliances.indexOf(id)>=0?' on':'');
    });})(ap.id,btn);
    appEl.appendChild(btn);
  });
  openM('modal-prof');
}
function renderProfWeekStart(){
  var el=gr('prof-wk');if(!el)return;
  el.innerHTML=DAYS.map(function(d,i){
    return '<button class="tchip'+(weekStart===i?' on':'')+'" onclick="setWeekStart('+i+')">'+d.slice(0,3)+'</button>';
  }).join('');
}
function setWeekStart(i){weekStart=i;renderProfWeekStart();}
function togPA(a){var btn=[].slice.call(gr('prof-al').querySelectorAll('.tchip')).find(function(b){return b.textContent===a;});if(userAllergens.indexOf(a)>=0){userAllergens=userAllergens.filter(function(x){return x!==a;});btn&&btn.classList.remove('on');}else{userAllergens.push(a);btn&&btn.classList.add('on');}}
function togPD(d){userDiet=userDiet===d?null:d;gr('prof-di').innerHTML=DIETS.map(function(di){return'<button class="tchip'+(userDiet===di?' on':'')+'" onclick="togPD(\''+di+'\')">'+di+'</button>';}).join('');}
function saveProfile(){
  closeM('modal-prof');
  // Save profile prefs locally only — no Firebase push (avoids stale plan overwrite)
  saveL('profile',{userAllergens:userAllergens,userDiet:userDiet,weekStart:weekStart,userSupermarket:userSupermarket,userAppliances:userAppliances});
  renderAll();
  gr('a-ind').style.display=userAllergens.length?'block':'none';
  gr('p-btn').style.display=userAllergens.length?'none':'block';
  showToast('Profile saved');
}

// MODAL
function openM(id){gr(id).classList.add('open');}
function closeM(id){gr(id).classList.remove('open');}
document.querySelectorAll('.overlay').forEach(function(o){o.addEventListener('click',function(e){if(e.target===o)o.classList.remove('open');});});
var rvcb=gr('rv-close-btn');if(rvcb)rvcb.addEventListener('click',function(){closeM('modal-rv');});
var randbtn=gr('random-btn');if(randbtn)randbtn.addEventListener('click',openRandom);
var rscw=gr('rscope-week');if(rscw)rscw.addEventListener('click',function(){randScope='week';renderRandScope();});
var rscd=gr('rscope-day');if(rscd)rscd.addEventListener('click',function(){randScope='day';renderRandScope();});
var rprev=gr('rand-preview-btn');if(rprev)rprev.addEventListener('click',previewRandom);
var rapply=gr('rand-apply-btn');if(rapply)rapply.addEventListener('click',applyRandom);
var rcanc=gr('rand-cancel');if(rcanc)rcanc.addEventListener('click',function(){closeM('modal-random');});

function renderAll(){renderDashboard();renderPlanner();if(gr('panel-shopping').classList.contains('active'))renderShop();renderCF();renderDF();renderRGrid();if(gr('panel-stock')&&gr('panel-stock').classList.contains('active'))renderStock();}

// RANDOM MEAL FEATURE
var randScope='week';
var randDay=DAYS[0];
var randTypes=['Breakfast','Lunch','Dinner'];
var randDiet='Any';
var randPlan={};

function openRandom(){
  randScope='week';randDay=DAYS[0];randTypes=['Breakfast','Lunch','Dinner'];randDiet='Any';randPlan={};
  renderRandScope();renderRandDayGrid();renderRandTypes();renderRandDietFilter();
  gr('rand-preview').innerHTML='';gr('rand-apply-btn').style.display='none';gr('rand-preview-btn').style.display='';
  openM('modal-random');
}
function renderRandScope(){
  gr('rscope-week').className='tchip'+(randScope==='week'?' on':'');
  gr('rscope-day').className='tchip'+(randScope==='day'?' on':'');
  gr('rand-day-pick').style.display=randScope==='day'?'block':'none';
}
function renderRandDayGrid(){
  var g=gr('rand-day-grid');g.innerHTML='';
  orderedDays().forEach(function(d){
    var b=document.createElement('button');b.className='day-sel-btn'+(randDay===d?' on':'');b.textContent=d.slice(0,3);
    b.addEventListener('click',function(){randDay=d;renderRandDayGrid();});g.appendChild(b);
  });
}
function renderRandTypes(){
  var g=gr('rand-types');g.innerHTML='';
  MT.forEach(function(t){
    var b=document.createElement('button');b.className='tchip'+(randTypes.indexOf(t)>=0?' on':'');b.textContent=t;
    b.addEventListener('click',function(){randTypes=randTypes.indexOf(t)>=0?randTypes.filter(function(x){return x!==t;}):randTypes.concat(t);renderRandTypes();});
    g.appendChild(b);
  });
}
function renderRandDietFilter(){
  var g=gr('rand-diet-filter');g.innerHTML='';
  ['Any'].concat(DIETS).forEach(function(d){
    var b=document.createElement('button');b.className='tchip'+(randDiet===d?' on':'');b.textContent=d;
    b.addEventListener('click',function(){randDiet=d;renderRandDietFilter();});g.appendChild(b);
  });
}
function getRandomRecipe(mealType,excludeIds){
  var pool=recipes.filter(function(r){if(randDiet!=='Any'&&r.diets.indexOf(randDiet)<0)return false;if(excludeIds&&excludeIds[r.id])return false;return true;});
  if(!pool.length)pool=recipes.filter(function(r){return!excludeIds||!excludeIds[r.id];});
  if(!pool.length)pool=recipes.slice();
  return pool[Math.floor(Math.random()*pool.length)];
}
function previewRandom(){
  if(!randTypes.length){showToast('Pick at least one meal type');return;}
  var skipPlanned=gr('rand-skip-planned').checked;
  var days=randScope==='week'?DAYS:[randDay];
  randPlan={};
  days.forEach(function(day){
    var usedToday={};
    var existing=plan[planKey(day)]||[];
    if(skipPlanned&&existing.length>0){randPlan[day]=null;return;}
    randTypes.forEach(function(mt){
      var r=getRandomRecipe(mt,usedToday);
      if(r){if(!randPlan[day])randPlan[day]=[];randPlan[day].push({recipeId:r.id,mealType:mt,recipeName:r.name});usedToday[r.id]=true;}
    });
  });
  var prev=gr('rand-preview');prev.innerHTML='';
  var hasAny=false;
  days.forEach(function(day){
    var meals=randPlan[day];
    var dayDiv=document.createElement('div');dayDiv.style.cssText='background:var(--cream);border:1.5px solid var(--paper3);border-radius:var(--rs);padding:10px 12px;margin-bottom:8px';
    var dTitle=document.createElement('div');dTitle.style.cssText='font-weight:600;font-size:13px;margin-bottom:6px;color:var(--ink2)';dTitle.textContent=day;dayDiv.appendChild(dTitle);
    if(!meals){var skip=document.createElement('div');skip.style.cssText='font-size:12px;color:var(--ink3)';skip.textContent='Skipped (already has meals)';dayDiv.appendChild(skip);}
    else{hasAny=true;meals.forEach(function(m){var row=document.createElement('div');row.style.cssText='font-size:13px;padding:2px 0;display:flex;gap:6px';var label=document.createElement('span');label.style.cssText='color:var(--ink3);font-size:11px;width:65px;flex-shrink:0;padding-top:1px';label.textContent=m.mealType;var name=document.createElement('span');name.textContent=m.recipeName;row.appendChild(label);row.appendChild(name);dayDiv.appendChild(row);});}
    prev.appendChild(dayDiv);
  });
  if(hasAny){gr('rand-apply-btn').style.display='';gr('rand-preview-btn').textContent='Re-roll';}
  else{gr('rand-apply-btn').style.display='none';}
}
function applyRandom() {
  var changedDates = [];

  Object.keys(randPlan).forEach(function(day) {
    var meals = randPlan[day];
    if (!meals) return;

    var k = planKey(day);

    if (!plan[k]) {
      plan[k] = [];
    }

    meals.forEach(function(meal) {
      plan[k].push({
        id: newId('meal'),
        recipeId: meal.recipeId,
        mealType: meal.mealType,
        updatedAt: Date.now()
      });
    });

    changedDates.push(k);
  });

  closeM('modal-random');
  renderPlanner();

  changedDates.forEach(function(dateKey) {
    persist('plan', dateKey);
  });

  showToast('Random meals added!');
}

// ─── WEB SHARE TARGET ─────────────────────────────────────────────────────────
// When opened via iOS/Android share sheet, shared URL arrives as ?share-url=...
function handleShareTarget(){
  try{
    var params=new URLSearchParams(window.location.search);
    var tab=params.get('tab');
    if(tab&&gr('panel-'+tab)){
      if(window.history&&window.history.replaceState)window.history.replaceState({},'',window.location.pathname);
      showTab(tab);
      return;
    }
    var shared=params.get('share-url')||params.get('url')||params.get('text');
    if(!shared)return;
    if(window.history&&window.history.replaceState)window.history.replaceState({},'',window.location.pathname);
    shared=shared.trim();
    if(/^https?:\/\//i.test(shared)){
      showTab('recipes');openImportModal('url');gr('url-input').value=shared;
      showToast('URL ready — tap Copy prompt or Extract');
    }else{
      showTab('recipes');openImportModal('paste');gr('paste-text').value=shared;
      showToast('Text pasted — tap Extract Recipe');
    }
  }catch(e){}
}

// ─── TIKTOK / SOCIAL TEXT CLEANER ─────────────────────────────────────────────
// Pre-cleans pasted text before sending to AI: strips hashtags, @mentions,
// URLs, most emoji, and normalises unicode fractions to decimals.
function cleanSocialText(raw){
  if(!raw)return raw;
  var t=raw;
  t=t.replace(/#\w+/g,'');           // hashtags
  t=t.replace(/@\w+/g,'');           // @mentions
  t=t.replace(/https?:\/\/\S+/g,''); // URLs
  // emoji (common ranges)
  t=t.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu,'');
  // unicode fractions → decimals
  t=t.replace(/\u00BD/g,'0.5').replace(/\u00BC/g,'0.25').replace(/\u00BE/g,'0.75')
     .replace(/\u2153/g,'0.33').replace(/\u2154/g,'0.67').replace(/\u215B/g,'0.125');
  t=t.replace(/\n{3,}/g,'\n\n').trim();
  return t;
}

// INIT
loadPersisted();
migrateLegacyPlan(loadL('currentWeekStartDate')||currentWeekStartKey());
syncWeekAnchor();
refreshMT();
renderDashboard();renderPlanner();renderCF();renderDF();renderRGrid();renderStock();renderExtras();
gr('a-ind').style.display=userAllergens.length?'block':'none';
gr('p-btn').style.display=userAllergens.length?'none':'block';
initImportButtons();
handleShareTarget();
setupKeyboardHandling();

// SERVICE WORKER
(function(){
  registerAppServiceWorker().then(function(reg){
    if(!reg)return;
    reg.addEventListener('updatefound',function(){
      var nw=reg.installing;if(!nw)return;
      nw.addEventListener('statechange',function(){
        if(nw.state==='installed'&&navigator.serviceWorker.controller){
          if(confirm('A new version of Mise en Place is ready. Reload now?')){
            navigator.serviceWorker.controller.postMessage({type:'SKIP_WAITING'});
            window.location.reload();
          }
        }
      });
    });
  }).catch(function(){});
  navigator.serviceWorker.addEventListener('message',function(e){
    if(e.data&&e.data.type==='UPDATE_AVAILABLE'){showToast('✓ Updated to '+e.data.version);}
  });
})();
