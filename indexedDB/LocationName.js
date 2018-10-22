window.indexedDB = window.indexDB || window.mozIndexedDB || window.webkitIndexDB
|| window.msIndexedDB;

let request = window.indexedDB.open("LocationGoods", 1),
db,
tx,
store,
index;

request.onupgradeneeded = function(e){
	let db = request.result,
		store = db.createObjectStore("LocationGoods", {keyPath:"lID"})
		//store = db.createObjectStore("LocationGoods", {autoIncrement: true})
		index = store.createIndex("name", "name", {unique: false});
};

request.onerror = function(e){
	console.log("there was an error:" + e.target.errorCode);
};
request.onsuccess = function(e){
	db = request.result;
	tx = db.transaction("LocationGoods", "readwrite");
	store = tx.objectStore("LocationGoods");
	index = store.index("LocationName");

	db.onerror = function(e) {
		console.log("ERROR" + e.target.errorCode);
	}
	store.put({lID: 1, LocationName: "Baguio City.",})
	store.put({lID: 2, LocationName: "Benguet"})
}



//https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB