import { getAuth, GoogleAuthProvider, EmailAuthProvider, PhoneAuthProvider, signOut, signInWithRedirect } from "https://www.gstatic.com/firebasejs/9.9.3/firebase-auth.js";
import { getFirestore, collection, where, getDocs, doc, getDoc, setDoc, addDoc, arrayUnion, updateDoc, query, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.9.3/firebase-firestore.js";


const db = getFirestore();
const auth = getAuth();
let currentUser;

// To apply the default browser preference instead of explicitly setting it.
auth.useDeviceLanguage();
//auth.languageCode = 'se';

const whenSignedIn = document.getElementById('whenSignedIn');
const whenSignedOut = document.getElementById('whenSignedOut');

const signInBtn = document.getElementById('signInBtn');
const signOutBtn = document.getElementById('signOutBtn');

const userName = document.getElementById('userName');
const userBeltGrade = document.getElementById('userBeltGrade');
const userBeltType = document.getElementById('userBeltType');
const userDojo = document.getElementById('userDojo');
const userSaveBtn = document.getElementById('userSaveButton');

const provider = new GoogleAuthProvider();

/// Sign in event handlers

signInBtn.onclick = () => signInWithRedirect(auth, provider);

signOutBtn.onclick = () => signOut(auth);

auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
        // signed in
        whenSignedIn.hidden = false;
        whenSignedOut.hidden = true;
        loadUserInfo();
        //userName.value = user.displayName;
    } else {
        // not signed in
        whenSignedIn.hidden = true;
        whenSignedOut.hidden = false;
        //userDetails.innerHTML = '';
    }
});

userSaveBtn.onclick = () => {
    setDoc(doc(db, 'users', currentUser.uid), {
        uid: currentUser.uid,
        name: userName.value,
        beltGrade: parseInt(userBeltGrade.value),
        beltType: userBeltType.value,
        dojo: userDojo.value,
        createdAt: serverTimestamp()
    }, {merge: true}).then(()=>{
        M.toast({
            html: 'Din profil har sparats',
            displayLength: 6000
        });
    });
}

function loadUserInfo() {
    getDoc(doc(db, "users", currentUser.uid)).then(docSnap=>{
        if (docSnap.exists()) {
            const d = docSnap.data();
            userName.value = d.name;
            userBeltGrade.value = d.beltGrade;
            userDojo.value = d.dojo;
            M.updateTextFields();
            // Select input is reset by the textfield update
            userBeltType.value = d.beltType;
          } else {
            userName.value = user.displayName;
            M.updateTextFields();
            M.toast({
                html: '<div>Inget tidigare profil hittades för dig. Gå till <b>Min profil</b> och fyll i dina uppgifter.</div>',
                displayLength: 6000
            });
          }
    })
}

function signUpToCompetion(competitionId, eventType) {
    const compRef = updateDoc(doc(db, 'competitions', competitionId),
    {
        competitionId: arrayUnion(user.uid)
    });
}

async function createCompetition(location, date) {
    const compRef = addDoc(collection(db, 'competitions'), {
        uid: user.uid,
        location: location,
        date: date,
        createdAt: serverTimestamp()
    });
    return compRef.id;
}