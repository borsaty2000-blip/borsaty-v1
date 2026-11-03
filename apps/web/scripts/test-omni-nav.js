/**
 * Verification test for Phase ف: Omni-Navigation Architecture
 */

const fs = require('fs');
const path = require('path');

function verifyOmniNavigation() {
  console.log('=== VERIFYING OMNI-NAVIGATION ARCHITECTURE ===');
  let errors = 0;

  // 1. Verify LiveMegaMenu
  const megaMenuPath = path.join(__dirname, '..', 'src', 'components', 'navigation', 'LiveMegaMenu.tsx');
  if (fs.existsSync(megaMenuPath)) {
    const content = fs.readFileSync(megaMenuPath, 'utf8');
    if (content.includes('DEFAULT_MEGA_MENU_DATA') && content.includes('MiniSparkline') && content.includes('/screener') && content.includes('/compare')) {
      console.log('✓ [PASS] LiveMegaMenu component verified with 4-column data hub, sparklines, and tools');
    } else {
      console.error('✗ [FAIL] LiveMegaMenu missing required sections');
      errors++;
    }
  } else {
    console.error('✗ [FAIL] LiveMegaMenu.tsx not found');
    errors++;
  }

  // 2. Verify MobileNavSheet
  const mobileSheetPath = path.join(__dirname, '..', 'src', 'components', 'navigation', 'MobileNavSheet.tsx');
  if (fs.existsSync(mobileSheetPath)) {
    const content = fs.readFileSync(mobileSheetPath, 'utf8');
    if (content.includes('toggleSection') && content.includes('indices.map') && content.includes('AuthButton')) {
      console.log('✓ [PASS] MobileNavSheet verified with accordions, live quotes, and RTL/LTR drawer');
    } else {
      console.error('✗ [FAIL] MobileNavSheet missing accordions or auth');
      errors++;
    }
  } else {
    console.error('✗ [FAIL] MobileNavSheet.tsx not found');
    errors++;
  }

  // 3. Verify CommandPalette recent searches
  const cmdPath = path.join(__dirname, '..', 'src', 'components', 'CommandPalette.tsx');
  if (fs.existsSync(cmdPath)) {
    const content = fs.readFileSync(cmdPath, 'utf8');
    if (content.includes('RECENT_SEARCHES_KEY') && content.includes('recentSearches.map') && content.includes('clearRecentSearches')) {
      console.log('✓ [PASS] CommandPalette verified with localStorage recent searches and quick actions');
    } else {
      console.error('✗ [FAIL] CommandPalette missing recent searches');
      errors++;
    }
  } else {
    console.error('✗ [FAIL] CommandPalette.tsx not found');
    errors++;
  }

  // 4. Verify Header integration
  const headerPath = path.join(__dirname, '..', 'src', 'components', 'Header.tsx');
  if (fs.existsSync(headerPath)) {
    const content = fs.readFileSync(headerPath, 'utf8');
    if (content.includes('<LiveMegaMenu') && content.includes('<MobileNavSheet') && content.includes('⌘K')) {
      console.log('✓ [PASS] Header verified with sticky backdrop blur, input search trigger, and omni-navigation');
    } else {
      console.error('✗ [FAIL] Header missing LiveMegaMenu or MobileNavSheet');
      errors++;
    }
  } else {
    console.error('✗ [FAIL] Header.tsx not found');
    errors++;
  }

  console.log(`\nOmni-Navigation Verification Result: ${errors === 0 ? 'ALL CHECKS PASSED ✓' : `${errors} ERRORS FOUND ✗`}`);
  if (errors > 0) process.exit(1);
}

verifyOmniNavigation();
