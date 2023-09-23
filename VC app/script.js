//Js reference to the contsineer where the remote feeds belong
let remoteContainer= document.getElementNyId("remote-container");

/**
 * @name addVideoContainer
 * @param uid - uid of the user
 * @descriton Helper function to add the video stream to "remote-container"
 */

function addVideoContainer(uid){
    let streamDiv=document.createElement("div"); //create a new div for every stream
    streamDiv.id=uid; //assigning id to div
    streamDiv.style.transform="rotateY(180deg)"; //Take care of lateral inversion(mirror image)
    remoteContainer.appendChild(streamDiv); //Add new div to container
}
/**
 * @name removeVidContainer
 * @param uid - uid of the user
 * @description Helper function to remove the video stream from "remote-container".
 */
function removeVideoContainer(uid){
    let remDiv=document.getElementById(uid);
    remDiv && remDiv.parentNode.removeChild(remDiv);
}

//client set up
//Defines a client RTC-real time communication
const client = AgoraRTC.createClient({mode:"rtc",codec:"vp8"});

//creating local media tracks and Initializing
const[localAudioTrack, localVideoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();

//initialize the stop button
initStop(client, localAudioTrack, localVideoTrack);

//play the local track
localVideoTrack.play('me');

stopBtn.disabled = false; //enable the stop button
stopBtn.onclick = null; //Remove any previous event listener
stopBtn.onclick = function(){
    client.unpublish(); //stop sending audio & video to agora
    localVideoTrack.stop(); //stops video track & removes the player from DoM
    localVideoTrack.close();  //Releases the resource
    localAudioTrack.stop();  //stops the audio track
    localAudioTrack.close();  //Releases the resources
    client.remoteUsers.forEach(user=>) {
        removeVideoContainer(user.uid) //clean up DoM
    }
    client.unsubscribe(user); //unscrubscribe from the user
};
client.removeAllListeners(); //clean up the client object to avoid memory leaks
stopBtn.disabled = true;

//adding event listeners
//set up event listeners for remote users publishing or unpublishing tracks
client.on("use-published",async(user,mediaType)=>{
    await client.subscribe(user, mediaType); //subscribe when a user publishes
    if(mediaType ==="video"){
        addVideoContainer(String(user,uid)) //uses helper method to add container for the videoTrack
        user.videoTrack.play(String(user.uid));
    }
    if(mediaType === "audio"){
        user.audioTrack.play(); //audio does not need a DOM element
    }});
client.on("user-unpublished",  async (user, mediaType)=>{
    if(mediaType === "video"){
        removeVideoContainer(user.uid) //removes the injected container
    }
});

//joining a channel
const _uid = await client.join(appId, channelId, token, null);
//publishing local tracks into the channel
await client.publish([localAudioTrack, localVideoTrack]);