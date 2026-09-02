document.addEventListener('DOMContentLoaded', () => {
  // 1. Select the menu elements
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileSidebar = document.getElementById('mobileSidebar');
  const closeSidebar = document.getElementById('closeSidebar');

  // 2. Function to open the sidebar
  if (mobileMenuBtn && mobileSidebar) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileSidebar.classList.remove('hidden');
    });
  }

  // 3. Function to close the sidebar using the "X" button
  if (closeSidebar && mobileSidebar) {
    closeSidebar.addEventListener('click', () => {
      mobileSidebar.classList.add('hidden');
    });
  }

  // 4. (Optional) Close the sidebar if the user clicks the dark background overlay
  if (mobileSidebar) {
    mobileSidebar.addEventListener('click', (event) => {
      // If the click was directly on the background (not the menu content itself)
      if (event.target === mobileSidebar) {
        mobileSidebar.classList.add('hidden');
      }
    });
  }
});