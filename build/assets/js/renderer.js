//------------------
// EDNA Staking Tool
// Version - 1.0.0
//------------------

let eosChain = 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906';
let chainURL = 'eos.greymass.com';
let chainPort = '443';
let network = { blockchain: 'eos', protocol: 'https', host: chainURL, port: chainPort, chainId: eosChain };
let eos = scatter.eos(network, Eos);
// Set Defaults
let contractName = 'ednazztokens';
let contractSymbal = 'EDNA';
let contractTable = 'stakes';
// Hide info until user is logged in.
let hideScatterLoginSub = document.getElementById("user-sub");
let eosAccountFunds = document.getElementById("accoutBal");
let stakeBtnDisplay = document.getElementById("stakeBtn");
let claimednaDisplay = document.getElementById("claimedna");
let unstakeBtnDisplay = document.getElementById("unstakeBtn");
let reloadDataDisplay = document.getElementById("reloadData");
// Lazy way to hide elements on page :D
hideScatterLoginSub.style.display = "none";
eosAccountFunds.style.display = "none";
scatterConnected.style.display = "none";
claimednaDisplay.style.display = "none";
unstakeBtnDisplay.style.display = "none";
stakeBtnDisplay.style.display = "none";
reloadDataDisplay.style.display = "none";

const config = {
    expireInSeconds: 60,
    broadcast: true,
    debug: false,
    sign: true,
    // mainNet bp endpoint
    httpEndpoint: chainURL,
    // mainNet chainId
    chainId: eosChain
};

/*=======================*/
/*====  Error Modals ====*/
/*=======================*/
// Put these here so we can call later
// Scatter not installed
function modalInstall() {
    //Install Scatter
    swal({
        title: "Scatter Not Detected",
        text: "To download scatter go to | get-scatter.com",
        type: "info",
        showCancelButton: false,
        cancelButtonClass: 'btn-secondary waves-effect',
        confirmButtonClass: 'btn-info waves-effect waves-light',
        confirmButtonText: 'Close'
    });
}
//Transaction Error
function modalDenied() {
    swal({
        title: "Transaction Error",
        text: "There was an issue submitting your transaction.",
        type: "error",
        showCancelButton: false,
        cancelButtonClass: 'btn-secondary waves-effect',
        confirmButtonClass: 'btn-danger waves-effect waves-light',
        confirmButtonText: 'Close'
    });
}
// User already staked
function modalCantStake() {
    swal({
        title: "You already staked",
        text: "To Stake more EDNA you need to unstake first.",
        type: "info",
        showCancelButton: false,
        cancelButtonClass: 'btn-secondary waves-effect',
        confirmButtonClass: 'btn-danger waves-effect waves-light',
        confirmButtonText: 'Close'
    });
}
// User dont have stake
function modalNoUnStake() {
    swal({
        title: "Nothing to Unstake",
        text: "You need to Stake EDNA to use this feature.",
        type: "info",
        showCancelButton: false,
        cancelButtonClass: 'btn-secondary waves-effect',
        confirmButtonClass: 'btn-danger waves-effect waves-light',
        confirmButtonText: 'Close'
    });
}
// User has nothing to claim
function modalNoClaim() {
    swal({
        title: "Nothing to Claim",
        text: "You tried to claim before your next reward",
        type: "info",
        showCancelButton: false,
        cancelButtonClass: 'btn-secondary waves-effect',
        confirmButtonClass: 'btn-danger waves-effect waves-light',
        confirmButtonText: 'Close'
    });
}
// User denied action
function dataSentToScatter() {
    swal({
        title: "Request Sent To Scatter",
        text: "Note: Look over the data before you submit!!!",
        type: "success",
        timer: 5000,
        showConfirmButton: false
    });
}
// Logged Out Modal
function logoutClicked() {
    //User denied action
    swal({
        title: "Your have successfully logged out",
        text: "See Ya Later :D",
        type: "success",
        timer: 3000,
        showConfirmButton: false
    });
}
// Data sent to Scatter
function sentSuccess() {
    //User denied action
    swal({
        title: "Transaction Successful!",
        text: "Reloading Data",
        type: "success",
        timer: 3000,
        showConfirmButton: false
    });
}
// Scatter login request
function modalLoginRequest() {
    //Install Scatter
    swal({
        title: "Identity Request Sent",
        text: "Choose an Identity within scatter.",
        type: "info",
        timer: 3000,
        showConfirmButton: false

    });
}
// Data login failed
function loginFail() {
    //User denied action
    swal({
        title: "Scatter Login Failed!",
        text: "User Denied",
        type: "error",
        timer: 3000,
        showConfirmButton: false
    });
}

/*=======================*/
/*=== Authentication ====*/
/*=======================*/
function scatterAuth() {
    // Grant access to scatter
    scatter.connect("EDNA Staking Tool").then(function (connected) {
        if (!connected) {
            console.log('Scatter Not Open or Installed');
            modalInstall();
            this.scatter = ScatterJS.scatter;
            window.scatter = null;
        } else if (connected) {
            hideScatterLoginSub.style.display = "none";
            eosAccountFunds.style.display = "none";
            reloadDataDisplay.style.display = "none";
            getAccountDetails();
            this.scatter = ScatterJS.scatter;
            window.scatter = null;
        }
    }).catch(error => {
        //console.log(error);
        console.log('...');
    });
}

/*=======================*/
/*== Scatter Identity ===*/
/*=======================*/

// Get Account from test network

function getAccountDetails() {
    scatter.getIdentity({ accounts: [network] }).then(function (id) {
        const account = id.accounts.find(function (x) {
            return x.blockchain === 'eos';
        });
        //console.log('account', account);
        hideScatterLoginSub.style.display = "";
        eosAccountFunds.style.display = "block";
        scatterConnected.style.display = "block";
        reloadDataDisplay.style.display = "";

        let accountID = account["name"];
        document.getElementById("scatter-login").textContent = accountID;

        // callback
        eos.getCurrencyBalance(contractName, accountID, contractSymbal).then(result => {
            if (result > '0.0000') {
                document.getElementById("accoutBal").textContent = result;
            } else {
                document.getElementById("accoutBal").textContent = '0.0000';
            }
        }).catch(e => {
            console.log(e);
        });

        // Contract Table
        eos.getTableRows({
            code: contractName,
            scope: contractName,
            table: contractTable,
            json: true,
            lower_bound: accountID,
            limit: 1
        }).then(table => {
            //Remove this
            console.log("Loading Account Details =======>");

            function getUserDetails(data) {
                return data.filter(value => {
                    return value.stake_account >= accountID;
                });
            }

            let userInfo = getUserDetails(table.rows);
            console.log(userInfo[0].stake_account === accountID);
            let sd = new Date(0); // The 0 there is the key, which sets the date to the epoch


            let today = Math.round(new Date().getTime() / 1000);
            console.log('Current Time ====> ' + today);
            document.getElementById("stakeType").textContent = 'No Term';
            document.getElementById("stakedBal").textContent = '0.0000';
            document.getElementById("stakeType").textContent = 'Not Available';
            document.getElementById("stakeDate").textContent = 'Not Available';
            document.getElementById("escrow").textContent = 'Not Available';
            stakeBtnDisplay.style.display = "block";
            unstakeBtnDisplay.style.display = "none";
            claimednaDisplay.style.display = "none";

            if (userInfo.length > 0) {
                //console.log(userInfo[0]);
                let accountTable = userInfo[0].stake_account === accountID;
                sd.setUTCSeconds(userInfo[0].stake_due);
                if (accountTable) {
                    let unstrBal = document.getElementById("stakedBal").textContent;
                    let totalunFounds = unstrBal.replace("0.0000", userInfo[0].staked);
                    document.getElementById("stakedBal").textContent = totalunFounds;
                    document.getElementById("stakeDate").textContent = sd;
                    document.getElementById("escrow").textContent = userInfo[0].escrow;
                    stakeBtnDisplay.style.display = "none";
                    unstakeBtnDisplay.style.display = "block";
                }
                function refreshData() {
                    if (accountTable && userInfo[0].stake_due <= today) {
                        claimednaDisplay.style.display = "block";
                    };
                }setInterval(refreshData, 1000);
                if (accountTable && userInfo[0].stake_period === 1) {
                    document.getElementById("stakeType").textContent = 'Weekly';
                }
                if (accountTable && userInfo[0].stake_period === 2) {
                    document.getElementById("stakeType").textContent = 'Monthly';
                }
                if (accountTable && userInfo[0].stake_period === 3) {
                    document.getElementById("stakeType").textContent = 'Quarterly';
                }
                if (accountTable && today > userInfo[0].stake_due) {
                    claimednaDisplay.style.display = "block";
                }
            } else {
                console.log('<======= Error Getting Data From Table');
            }
        }).catch(e => {
            loginFail();
            console.log(e);
        });
    }).catch(e => {
        loginFail();
        console.log(e);
    });
}

/*=======================*/
/*===  Scatter Login ====*/
/*=======================*/
document.getElementById("scatter-login").addEventListener("click", loginEDNA);
function loginEDNA() {
    try {
        if (!scatter.identity) {
            modalLoginRequest();
            scatterAuth();
        } else {}
    } catch (e) {
        modalInstall();
        console.log('Scatter not connecting so we cannot get identity, reload and try again...');
        console.log(e);
    }
}

/*=======================*/
/*======= Staking =======*/
/*=======================*/
document.getElementById("stake").addEventListener("click", stakeEDNA);

function stakeEDNA() {
    const eosOptions = { expireInSeconds: 30 };
    const eos = scatter.eos(network, Eos, eosOptions);
    const account = scatter.identity.accounts.find(acc => acc.blockchain === 'eos');
    const transactionOptions = { authorization: [`${account.name}@${account.authority}`] };
    let stakeAmount = document.getElementById('stakeAmount').value;
    let stakingPeriod = document.getElementById('stakingPeriod').value;
    let stakingAgree = document.getElementById('agreed').checked;
    let stakeOutput = stakeAmount + ' ' + contractSymbal;
    let stakeInt = parseInt(stakingPeriod);
    console.log('Staking Period =====> ' + stakeInt);
    console.log('User agreed =====> ' + stakingAgree);

    if (stakeAmount === '0' || stakeAmount === '0.0000') {
        alert("You need to enter stake amount.");
    } else if (stakeInt === 0) {
        alert("You need to select a staking period.");
    } else if (stakingAgree != true) {
        alert("You must agree to the rules of this contract");
    } else {
        eos.contract(contractName).then(token => {
            token.stake(account.name, stakeInt, stakeOutput, transactionOptions).then(result => {
                sentSuccess();
                setTimeout(function () {
                    getAccountDetails();
                }, 2500);
            }).catch(error => {
                //denied
                modalDenied();
                console.log(error);
                console.log('<======== There was an error');
            });

            dataSentToScatter();
            Custombox.close();
            console.log('Data sent to scatter, waiting for status..... ');
        }).catch(error => {
            //denied
            modalCantStake();
            console.log(error);
            console.log('<======== There was an error');
        });
    }
}

/*=======================*/
/*====== Unstaking ======*/
/*=======================*/
document.getElementById("unStake").addEventListener("click", unstakeEDNA);

function unstakeEDNA() {
    // Get test network
    const eosOptions = { expireInSeconds: 30 };
    const eos = scatter.eos(network, Eos, eosOptions);
    const account = scatter.identity.accounts.find(acc => acc.blockchain === 'eos');
    const transactionOptions = { authorization: [`${account.name}@${account.authority}`] };

    eos.contract(contractName).then(token => {
        token.unstake(account.name, transactionOptions).then(result => {
            sentSuccess();
            setTimeout(function () {
                getAccountDetails();
            }, 2500);
        }).catch(error => {
            modalDenied();
            console.log(error);
            console.log('<======== There was an error');
        });
        dataSentToScatter();
        console.log('Asking Scatter for permission =======>');
    }).catch(error => {
        modalNoUnStake();
        console.log(error);
        console.log('<======== There was an error');
    });
}

/*=======================*/
/*===== Claim EDNA ======*/
/*=======================*/
document.getElementById("claimedna").addEventListener("click", claimEDNA);

function claimEDNA() {
    // Get test network
    const eosOptions = { expireInSeconds: 30 };
    const eos = scatter.eos(network, Eos, eosOptions);
    const account = scatter.identity.accounts.find(acc => acc.blockchain === 'eos');
    const transactionOptions = { authorization: [`${account.name}@${account.authority}`] };

    eos.contract(contractName).then(token => {
        dataSentToScatter();
        console.log('Data sent to scatter, waiting for status..... ');
        token.claim(account.name, transactionOptions).then(result => {
            sentSuccess();
            setTimeout(function () {
                getAccountDetails();
            }, 2500);
        }).catch(error => {
            //denied
            modalDenied();
            console.log(error);
            console.log('<======== There was an error');
        });
    }).catch(error => {
        //denied
        modalNoClaim();
        console.log(error);
        console.log('<======== There was an error');
    });
}

/*=======================*/
/*===  Scatter Logout ===*/
/*=======================*/
document.getElementById("forget").addEventListener("click", scatterForget);

function scatterForget() {
    scatter.forgetIdentity();
    logoutClicked();
    setTimeout(function () {
        location.reload();
    }, 2500);
}