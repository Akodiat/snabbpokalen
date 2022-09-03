import { getAuth, GoogleAuthProvider, EmailAuthProvider, PhoneAuthProvider, signOut, signInWithRedirect } from "https://www.gstatic.com/firebasejs/9.9.3/firebase-auth.js";
import { getFirestore, collection, where, getDocs, doc, getDoc, setDoc, addDoc, arrayUnion, updateDoc, query, serverTimestamp, onSnapshot } from "https://www.gstatic.com/firebasejs/9.9.3/firebase-firestore.js";


const db = getFirestore();
const auth = getAuth();
let currentUser;

// To apply the default browser preference instead of explicitly setting it.
auth.useDeviceLanguage();
//auth.languageCode = 'se';

const whenSignedIn = document.getElementById('whenSignedIn');
const whenSignedOut = document.getElementById('whenSignedOut');
const signInProgress = document.getElementById('signInProgress');
const signInDiv = document.getElementById('signInDiv');

const signInBtn = document.getElementById('signInBtn');
const signOutBtn = document.getElementById('signOutBtn');

const userName = document.getElementById('userName');
const userBeltGrade = document.getElementById('userBeltGrade');
const userBeltType = document.getElementById('userBeltType');
const userDojo = document.getElementById('userDojo');
const userSaveBtn = document.getElementById('userSaveButton');

const createCompetitionDate = M.Datepicker.init(
    document.getElementById('createCompetitionDate'), {
        firstDay: 1,
        format: 'dddd yyyy-mm-dd'

});
const createCompetitionTime = M.Timepicker.init(
    document.getElementById('createCompetitionTime'), {
        twelveHour: false
});
const createCompetitionPlace = document.getElementById('createCompetitionPlace');
const competitionCreateButton = document.getElementById('competitionCreateButton');
const competitionCreateText = document.getElementById('competitionCreateText');

const competitionsList = document.getElementById("competitionsList");


const provider = new GoogleAuthProvider();

/// Sign in event handlers

signInBtn.onclick = () => {
    signInProgress.hidden = false;
    signInDiv.hidden = true;
    signInWithRedirect(auth, provider)
};

signOutBtn.onclick = () => signOut(auth);

auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
        // signed in
        signInProgress.hidden = false;
        signInDiv.hidden = true
        whenSignedIn.hidden = false;
        whenSignedOut.hidden = true;
        loadUserInfo();
        loadCompetitions();
        //userName.value = user.displayName;
    } else {
        // not signed in
        signInProgress.hidden = true;
        signInDiv.hidden = false;
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

competitionCreateButton.onclick = () => {
    let date = createCompetitionDate.date;
    date.setHours(createCompetitionTime.hours, createCompetitionTime.minutes);
    const competitionId = currentUser.uid+'_'+date.toISOString();
    setDoc(doc(db, 'competitions', competitionId), {
        uid: currentUser.uid,
        time: date,
        place: createCompetitionPlace.value,
        infoText: competitionCreateText.value,
        createdAt: serverTimestamp()
    }, {merge: true}).then(()=>{
        M.toast({
            html: 'Den nya tävlingen har lagts till',
            displayLength: 6000
        });
    });
}
function loadCompetitions() {
    // Redraw competitions list on every edit
    const q = query(collection(db, "competitions"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        competitionsList.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            let c = document.createElement('li');
            let d = new Date(data.time.seconds*1000);
            c.classList.add('collection-item', 'avatar');
            if (data.uid == currentUser.uid) {
                let a = document.createElement('a');
                a.classList.add("btn")
                a.innerHTML = `<i class="material-icons circle green">start</i>`
                c.appendChild(a);
                a.onclick = ()=>alert("hej")
            } else {
                c.innerHTML = `<i class="material-icons circle blue">event</i>`
            }
            c.innerHTML += `<b class="title">${data.place}</b>
            <p>${d.toLocaleString('sv-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'})}<p>${data.infoText ? data.infoText : ''}`
            // If user is the creator of the competition,
            // add an edit button
            if (data.uid == currentUser.uid) {
                let a = document.createElement('a');
                a.classList.add("secondary-content", "modal-trigger");
                a.href="#modal1"
                a.innerHTML = `<i class="material-icons">edit</i>`
                c.appendChild(a);
            }
            competitionsList.appendChild(c);
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
