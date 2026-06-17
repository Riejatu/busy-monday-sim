import './style.css';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="desktop">
    <div class="desktop-icon" id="email-icon">
      <div class="icon-box">✉</div>
      <div>Email</div>
    </div>

    <div class="window hidden" id="email-window">
      <div class="window-titlebar">
        <span>Mail</span>
        <button id="close-email">×</button>
      </div>

      <div class="mail-layout">
        <div class="mail-list">
          <button class="mail-item" data-email="benefits">
            <strong>Benefits enrollment expires today</strong>
            <span>Susan Miller</span>
          </button>

          <button class="mail-item" data-email="picnic">
            <strong>Company picnic photos</strong>
            <span>Paul from Marketing</span>
          </button>
        </div>

        <div class="mail-body" id="mail-body">
          Select an email.
        </div>
      </div>
    </div>

    <div class="taskbar">
      <span>Busy Monday Simulation</span>
    </div>
  </div>
`;

const emailWindow = document.querySelector<HTMLDivElement>('#email-window')!;
const emailIcon = document.querySelector<HTMLDivElement>('#email-icon')!;
const closeEmail = document.querySelector<HTMLButtonElement>('#close-email')!;
const mailBody = document.querySelector<HTMLDivElement>('#mail-body')!;

emailIcon.addEventListener('dblclick', () => {
  emailWindow.classList.remove('hidden');
});

closeEmail.addEventListener('click', () => {
  emailWindow.classList.add('hidden');
});

document.querySelectorAll<HTMLButtonElement>('.mail-item').forEach((button) => {
  button.addEventListener('click', () => {
    const emailId = button.dataset.email;

    if (emailId === 'benefits') {
      mailBody.innerHTML = `
        <h2>Benefits enrollment expires today</h2>
        <p><strong>From:</strong> Susan Miller &lt;susan.miller@company-benefits.co&gt;</p>
        <p>Please confirm your benefits information immediately.</p>
        <p>
          <a href="#" class="inspectable-link" data-real-url="https://company-benefits.co/login">
            Confirm benefits information
          </a>
        </p>
        <div class="actions">
          <button id="report-email">Report</button>
          <button id="trust-email">Trust</button>
          <button id="ignore-email">Ignore</button>
        </div>
      `;

      document.querySelector<HTMLButtonElement>('#report-email')!
        .addEventListener('click', () => {
          alert('Good catch. The sender domain is not company.com.');
        });
    }

    if (emailId === 'picnic') {
      mailBody.innerHTML = `
        <h2>Company picnic photos</h2>
        <p><strong>From:</strong> Paul &lt;paul@company.com&gt;</p>
        <p>Here are the photos from the company picnic.</p>
      `;
    }
  });
});