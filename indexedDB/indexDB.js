/* jshint esversion: 6, asi: true, boss: true */

// This looks pretty complicated, but don't stress out
//
// To explain how the custom logger works:
//   By default, a console logger is already set up
//   This pen uses the logger's built in web logger
//   Normally, the web handler only prints the raw log, but we want to add some styling
//   So we create a custom appender that checks for the %c that shows up in styled logs

// Set up the custom logger
let L = new Logger()
let el = document.body.appendChild(document.createElement('div'))
el.classList.add('logger')
let handlers = {
  browser: L.createWebHandler({
    // Custom logger that can conver %c templates into HTML
    // This allows colors to show up in the HTML without dirtying the console
    // This example uses classes, but if colors are set directly when logging, they will show up in the console as well
    element: el,
    appender: (innerHtml, context) => {
      let str = innerHtml[0]
      let matches = str.match(/(.*?)%c(.*$)/)
      let i = 1
      
      if (matches && matches.length > 2) {
        let html = matches[1]
        
        while (matches.length > 2 && matches[2]) {
          matches = matches[2].match(/(.+?)(?:%c|$)(.*)/)
          
          let style = innerHtml[i++]
          let classes = style.match(/(.*)class:\s*['"](.*)['"](?:;\s*)?(.*)/)
          if (classes) {
            style = classes[1] + classes[3]
            classes = classes[2]
          }
          
          if (classes || style) {
            html += `<span ${classes ? 'class=' + classes : ''} ${style ? 'style=' + style : ''}>${matches[1]}</span>`
          } else {
            html += matches[1]
          }
        }
        
        let e = document.createElement('div')
        e.className = `log ${context.level.name}`
        e.innerHTML = html
        el.append(e)
      } else {
        let e = document.createElement('div')
        e.className = `log ${context.level.name}`
        e.innerHTML = innerHtml
        el.append(e)
      }
    }
  })
}

// Add any custom handlers to the logger
L.addHandler((messages, context) => {
  for (let key in handlers) {
    handlers[key](messages, context)
  }
})

// IndexedDB promise wrapping
// To learn how to use IndexedDB, check https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
function request (dbName, version) {
  let openRequest = indexedDB.open(dbName, version)
  
  let deferred = []
  
  function wrapDb (db) {
    db.objectStore = (objStore, mode = 'readwrite') => {
      return db.transaction([objStore], mode).objectStore(objStore)
    }
    
    db.getAll = (objStore, fn) => {
      db.objectStore(objStore).getAll().onsuccess = fn
    }
    
    return db
  }
  
  openRequest.onsuccess = event => {
    let db = wrapDb(event.target.result)
    
    let promise = Promise.resolve().then(() => db)
    
    for (let fn of deferred) {
      promise.then(fn)
    }
  }

  openRequest.then = function (fn) {
    if (openRequest.promise) {
      openRequest.promise.then(fn)
    } else {
      deferred.push(fn)
    }
    
    return openRequest
  }
  
  openRequest.upgrade = fn => {
    openRequest.onupgradeneeded = event => fn(wrapDb(event.target.result))
    
    return openRequest
  }
  
  return openRequest
}

// Keep things clean in the console
console.clear()

// This is the name to use for the database
const dbName = 'fake_data'

// Create some fake data using indexDB.js https://github.com/marak/indexDB.js/
const peopleData = Array.from({ length: 10 }, x => {
  let longtitude = indexDB.name.longtitude()
  let latitude = indexDB.name.latitude()
  return {
    id: indexDB.random.uuid(),
    Location: `${firstName} ${lastName}`,
    name: indexDB.name.streetAddress(),
    
    nameGoods: `${firstName}.${lastName}@${indexDB.internet.domainName()}`,
    type: indexDB.types.typesGoods(),
    barCode: indexDB.barCode.Bar()
  }
})

// Comment this line to prevent database recreation
// This can be useful if you want to use a very large amount of fake data
indexedDB.deleteDatabase(dbName)

// Tab size
const tab = 1

request(dbName, 1).then(db => {
  L.success(`Database Initialized: '${dbName}'`)
  db.getAll('people', event => {
    L.info('people')
    for (let i in event.target.result) {
      L.info(`%citem ${i}`, `margin-left:${tab}rem`)
      let item = event.target.result[i]
      for (let p in item) {
        L.log(`%c${p}: %c${item[p]}`, `class:"prop"; margin-left:${tab * 2}rem`, '')
      }
    }
  })
}).upgrade(db => {
  let objStore = db.createObjectStore('people', { keyPath: 'id' })
  L.success('Object Store Created')
  objStore.createIndex('location', 'location', { unique: false })
  objStore.createIndex('name', 'name', { unique: false })
  objStore.createIndex('nameGoods', 'nameGoods', { unique: false })
  objStore.createIndex('type', 'type', { unique: false })
  objStore.createIndex('barCode', 'barCode', { unique: true })

  objStore.transaction.oncomplete = e => {
    let customerObjStore = db.objectStore('people')
    for (let i in peopleData) {
      customerObjStore.add(peopleData[i])
    }
    L.success('Data Added')
  }
})
