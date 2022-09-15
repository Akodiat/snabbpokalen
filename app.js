import { getAuth, GoogleAuthProvider, EmailAuthProvider, PhoneAuthProvider, signOut, signInWithRedirect } from "https://www.gstatic.com/firebasejs/9.9.3/firebase-auth.js";
import { getFirestore, collection, where, getDocs, doc, getDoc, setDoc, addDoc, deleteDoc, arrayUnion, updateDoc, query, serverTimestamp, onSnapshot } from "https://www.gstatic.com/firebasejs/9.9.3/firebase-firestore.js";


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


let isEditingCompetition = false;

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

const competitionSignUpSelectCompetition = document.getElementById("competitionSignUpSelectCompetition");
const competitionSignUpButton = document.getElementById("competitionSignUpButton");
const competitionSignUpHokei = document.getElementById("competitionSignUpHokei");
const competitionSignUpJissen = document.getElementById("competitionSignUpJissen");


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

competitionSignUpButton.onclick = () => {
    const competitionId = competitionSignUpSelectCompetition.value
    const regId = competitionId + '_' + currentUser.uid;
    setDoc(doc(db, 'registrations', regId), {
        uid: currentUser.uid,
        competition: competitionId,
        hokei: competitionSignUpHokei.checked,
        jissen: competitionSignUpJissen.checked,
        createdAt: serverTimestamp()
    }, {merge: true}).then(()=>{
        M.toast({
            html: 'Din anmälan har sparats',
            displayLength: 6000
        });
    });
}

competitionCreateButton.onclick = () => {
    let date = createCompetitionDate.date;
    date.setHours(createCompetitionTime.hours, createCompetitionTime.minutes);
    const competitionId = date.toISOString()+'_'+currentUser.uid;
    const data = {
        uid: currentUser.uid,
        time: date,
        place: createCompetitionPlace.value,
        infoText: competitionCreateText.value,
        createdAt: serverTimestamp()
    };
    setDoc(doc(db, 'competitions', competitionId), data, {merge: true}).then(()=>{
        M.toast({
            html: 'Tävlingen har sparats',
            displayLength: 6000
        });
    });
}
/*
function prefillCompetitionInfo(data) {
    const date = new Date(data.time.seconds*1000)
    createCompetitionDate.setDate(date);
    createCompetitionDate.el.value = date.toDateString();
    const time = `${date.getHours()}:${date.getMinutes()}`;
    createCompetitionTime.options.defaultTime = time;
    createCompetitionTime.el.value = time;
    createCompetitionPlace.value = data.place;
    competitionCreateText.value = data.infoText ? data.infoText : '';
    M.updateTextFields();
}
*/

function dateStrFromCompetition(competitionData) {
    let d = new Date(competitionData.time.seconds*1000);
    return d.toLocaleString('sv-SE', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
}

function loadCompetitions() {
    // Redraw competitions list on every edit
    const q = query(collection(db, "competitions"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        competitionsList.innerHTML = '';
        querySnapshot.forEach(competition => {
            const data = competition.data();
            let item = document.createElement('li');
            let header = document.createElement('div');
            header.classList.add("collapsible-header");
            item.appendChild(header);
            header.innerHTML = `<i class="material-icons">event</i><b>${data.place}</b>&nbsp;
            ${dateStrFromCompetition(data)}
            <span class="badge" data-badge-caption="anmälda">0</span></div>`
            let body = document.createElement('div');
            body.classList.add("collapsible-body");
            body.innerHTML = `<p>${data.infoText ? data.infoText : ''}`;
            item.appendChild(body);
            // If user is the creator of the competition,
            if (data.uid == currentUser.uid) {
                // Add an edit button
                /*
                let editButton = document.createElement('a');
                editButton.classList.add("modal-trigger");
                editButton.href="#competitionEditModal"
                editButton.onclick = ()=>{
                    prefillCompetitionInfo(data);
                };
                editButton.innerHTML = ` <i class="material-icons">edit</i>`
                header.appendChild(editButton);
                */
                let removeButton = document.createElement('a');
                removeButton.onclick = event=>{
                    event.stopPropagation();
                    deleteDoc(doc(db, 'competitions', competition.id)).then(()=>{
                        M.toast({
                            html: 'Tävlingen har tagits bort',
                            displayLength: 6000
                        });
                    })
                };
                removeButton.innerHTML = ` <i class="material-icons">delete</i>`
                header.appendChild(removeButton);
                // Add a start button
                let startButton = document.createElement('a');
                startButton.innerHTML = `<i class="material-icons">start</i>`
                header.appendChild(startButton);
            }
            // Add a sign-up button
            let signUpButton = document.createElement('a');
            signUpButton.classList.add("modal-trigger");
            signUpButton.href="#competitionSignUpModal";
            signUpButton.onclick = (event)=>{
                competitionSignUpSelectCompetition.innerHTML = '';
                querySnapshot.forEach(c => {
                    const d = c.data();
                    const selected = competition.id == c.id ? ' selected': '';
                    competitionSignUpSelectCompetition.innerHTML += `<option value="${c.id}"${selected}>${d.place} - ${dateStrFromCompetition(d)}</option>`;
                });
                M.FormSelect.init(competitionSignUpSelectCompetition);
            };
            signUpButton.innerHTML = `<i class="material-icons">person_add</i>`
            header.appendChild(signUpButton);

            competitionsList.appendChild(item);
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
