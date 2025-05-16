import{C as a,B as l}from"./main--AmmKLiY.js";const n={users:(t,e)=>a.api.patch_user_public({userId:t},e),teams:(t,e)=>a.api.patch_team_public({teamId:t},e)};function u(t){const e=t.currentTarget,i=e.dataset.accountId,s=e.dataset.state==="visible",o={hidden:s};n[a.config.userMode](i,o).then(d=>{d.success&&(e.dataset.state=s?"hidden":"visible",e.classList.toggle("btn-danger",s),e.classList.toggle("btn-success",!s),e.textContent=s?"Hidden":"Visible")})}function b(t,e){const i={hidden:e==="hidden"},c=[];t.accounts.forEach(s=>{c.push(n[a.config.userMode](s,i))}),t.users.forEach(s=>{c.push(n.users(s,i))}),Promise.all(c).then(()=>{window.location.reload()})}function m(t){const e=document.querySelector(".tab-pane.active"),i=Array.from(e.querySelectorAll("input[data-account-id]:checked")).map(o=>o.dataset.accountId),c=Array.from(e.querySelectorAll("input[data-user-id]:checked")).map(o=>o.dataset.userId),s={accounts:i,users:c};l({title:"Toggle Visibility",body:`
      <form id="scoreboard-bulk-edit">
  <div class="form-group mb-3">
    <label for="visibility-select" class="form-label">Visibility</label>
    <select id="visibility-select" name="visibility" class="form-select" required>
      <option value="">--</option>
      <option value="visible">Visible</option>
      <option value="hidden">Hidden</option>
    </select>
  </div>
</form>
    `,button:"Submit",success:()=>{const o=document.getElementById("scoreboard-bulk-edit"),r=new FormData(o).get("visibility");r&&b(s,r)}})}document.addEventListener("DOMContentLoaded",()=>{document.querySelectorAll(".scoreboard-toggle").forEach(e=>{e.addEventListener("click",u)});const t=document.getElementById("scoreboard-edit-button");t&&t.addEventListener("click",m)});
