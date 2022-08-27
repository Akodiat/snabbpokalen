import { getAuth, GoogleAuthProvider, signOut, signInWithRedirect } from "https://www.gstatic.com/firebasejs/9.9.3/firebase-auth.js";
import { getFirestore, collection, where, getDocs, addDoc, query, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.9.3/firebase-firestore.js";
///// User Authentication /////

const auth = getAuth();

const whenSignedIn = document.getElementById('whenSignedIn');
const whenSignedOut = document.getElementById('whenSignedOut');

const signInBtn = document.getElementById('signInBtn');
const signOutBtn = document.getElementById('signOutBtn');

const userDetails = document.getElementById('userDetails');


const provider = new GoogleAuthProvider();

/// Sign in event handlers

signInBtn.onclick = () => signInWithRedirect(auth, provider);

signOutBtn.onclick = () => signOut(auth);

auth.onAuthStateChanged(user => {
    if (user) {
        // signed in
        whenSignedIn.hidden = false;
        whenSignedOut.hidden = true;
        userDetails.innerHTML = `<h3>Hello ${user.displayName}!</h3> <p>User ID: ${user.uid}</p>`;
    } else {
        // not signed in
        whenSignedIn.hidden = true;
        whenSignedOut.hidden = false;
        userDetails.innerHTML = '';
    }
});


//initializeApp
///// Firestore /////

const db = getFirestore();

const createThing = document.getElementById('createThing');
const thingsList = document.getElementById('thingsList');


let thingsRef;
let unsubscribe;

auth.onAuthStateChanged(user => {

    if (user) {
        // Database Reference
        thingsRef = collection(db, 'things');

        createThing.onclick = () => {
            addDoc(thingsRef, {
                uid: user.uid,
                name: document.getElementById('belt').value,
                createdAt: serverTimestamp()
            });
        }

        const q = query(thingsRef, where('uid', '==', user.uid));
        getDocs(q).then(querySnapshot=>{
            const items = [];
            querySnapshot.forEach(doc => {
                items.push(`<li>${doc.data().name}</li>`)
            });
            thingsList.innerHTML = items.join('');
        })

    } else {
        // Unsubscribe when the user signs out
        unsubscribe && unsubscribe();
    }
});

