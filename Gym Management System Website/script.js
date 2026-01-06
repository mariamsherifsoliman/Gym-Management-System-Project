/******************************
 SUPABASE CONFIG
 ⚠️ REPLACE WITH YOUR CREDENTIALS
******************************/
const supabaseUrl = 'https://nzwsinchqfgyxoqmwgsw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56d3NpbmNocWZneXhvcW13Z3N3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NjI2MTksImV4cCI6MjA4MjIzODYxOX0.YcONdZhKCtMbb9xMQrvOfq5N9GrekYdkGvYG2_QLnKA';

const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

/******************************
 TABLE CONFIGS
******************************/
const tableConfigs = {
  admin: {
    id: 'admin_id',
    fields: ['first_name', 'last_name', 'email_address', 'phone_number']
  },
  coach: {
    id: 'coach_id',
    fields: ['f_name', 'l_name', 'email_address', 'phone_number', 'admin_id']
  },
  client: {
    id: 'client_id',
    fields: [
      'first_name',
      'last_name',
      'date_of_birth',
      'gender',
      'phone_number',
      'email',
      'coach_id',
      'membership_id'
    ]
  },
  membership: {
    id: 'membership_id',
    fields: ['membership_type', 'start_date', 'duration', 'price']
  },
  nutrition_plan: {
    id: 'n_plan_id',
    fields: [
      'client_id',
      'coach_id',
      'diet_plan',
      'calories_intake',
      'protein_target',
      'carbs_target',
      'fats_target'
    ]
  },
  workout_plan: {
    id: 'w_plan_id',
    fields: [
      'client_id',
      'coach_id',
      'goal',
      'level',
      'duration_weeks'
    ]
  }
};

let currentTable = 'admin';
let editingRecordId = null;

/******************************
 INITIALIZATION
******************************/
window.onload = () => {
  loadForm();
  loadTable();
};

/******************************
 TAB SWITCHING
******************************/
function switchTab(table) {
  currentTable = table.toLowerCase();
  
  document.querySelectorAll('.tab').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  const title = currentTable.replace('_', ' ').split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
  
  document.getElementById('form-title').innerText = title + ' Form';
  clearForm();
  loadForm();
  loadTable();
}

/******************************
 FORM GENERATION
******************************/
function loadForm() {
  const form = document.getElementById('data-form');
  form.innerHTML = '';

  tableConfigs[currentTable].fields.forEach(field => {
    // Gender dropdown - ONLY M and F
    if (field === 'gender') {
      const select = document.createElement('select');
      select.id = field;
      select.innerHTML = `
        <option value="">Select Gender</option>
        <option value="M">Male</option>
        <option value="F">Female</option>
      `;
      form.appendChild(select);
    }
    // Membership Type dropdown
    else if (field === 'membership_type') {
      const select = document.createElement('select');
      select.id = field;
      select.innerHTML = `
        <option value="">Select Type</option>
        <option value="Daily">Daily</option>
        <option value="Weekly">Weekly</option>
        <option value="Monthly">Monthly</option>
        <option value="Quarterly">Quarterly</option>
        <option value="Semi-Annual">Semi-Annual</option>
        <option value="Yearly">Yearly</option>
      `;
      form.appendChild(select);
    }
    // Goal dropdown
    else if (field === 'goal') {
      const select = document.createElement('select');
      select.id = field;
      select.innerHTML = `
        <option value="">Select Goal</option>
        <option value="Fat Loss">Fat Loss</option>
        <option value="Muscle Gain">Muscle Gain</option>
        <option value="Hypertrophy">Hypertrophy</option>
        <option value="Strength">Strength</option>
        <option value="Endurance">Endurance</option>
        <option value="Athletic Performance">Athletic Performance</option>
        <option value="General Fitness">General Fitness</option>
        <option value="Rehabilitation">Rehabilitation</option>
      `;
      form.appendChild(select);
    }
    // Level dropdown
    else if (field === 'level') {
      const select = document.createElement('select');
      select.id = field;
      select.innerHTML = `
        <option value="">Select Level</option>
        <option value="Beginner">Beginner</option>
        <option value="Intermediate">Intermediate</option>
        <option value="Advanced">Advanced</option>
        <option value="Elite">Elite</option>
      `;
      form.appendChild(select);
    }
    // Regular input fields
    else {
      const input = document.createElement('input');
      input.placeholder = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      input.id = field;
      
      // Set input types
      if (field.includes('date')) {
        input.type = 'date';
      } else if (field.includes('email')) {
        input.type = 'email';
      } else if (field.includes('phone')) {
        input.type = 'tel';
        input.placeholder = input.placeholder + ' (min 11 digits)';
      } else if (field.includes('_id') || field === 'duration' || field === 'duration_weeks' || 
                 field.includes('intake') || field.includes('target') || field === 'price') {
        input.type = 'number';
        input.step = field === 'price' ? '0.01' : '1';
        input.min = '0';
      }
      
      form.appendChild(input);
    }
  });
}

function clearForm() {
  tableConfigs[currentTable].fields.forEach(field => {
    const input = document.getElementById(field);
    if (input) input.value = '';
  });
}

/******************************
 LOAD TABLE DATA - FIXED
******************************/
async function loadTable() {
  const tableBody = document.getElementById('table-body');
  tableBody.innerHTML = '<tr><td colspan="100" class="loading">⏳ Loading data...</td></tr>';

  try {
    // Force fresh data with no caching
    const { data, error } = await supabaseClient
      .from(currentTable)
      .select('*')
      .order(tableConfigs[currentTable].id, { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      tableBody.innerHTML = `<tr><td colspan="100" class="empty-state">❌ Error: ${error.message}</td></tr>`;
      return;
    }

    if (!data || data.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="100" class="empty-state">🔭 No records found. Add your first record above!</td></tr>';
      return;
    }

    tableBody.innerHTML = '';
    
    // Create header row
    const headerRow = document.createElement('tr');
    Object.keys(data[0]).forEach(col => {
      const th = document.createElement('th');
      th.innerText = col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      headerRow.appendChild(th);
    });
    const actionTh = document.createElement('th');
    actionTh.innerText = 'Actions';
    headerRow.appendChild(actionTh);
    tableBody.appendChild(headerRow);

    // Create data rows
    data.forEach((row) => {
      const tr = document.createElement('tr');
      Object.values(row).forEach(val => {
        const td = document.createElement('td');
        td.innerText = val !== null ? val : '-';
        tr.appendChild(td);
      });

      // Add action buttons
      const actionTd = document.createElement('td');
      const editBtn = document.createElement('button');
      editBtn.className = 'btn-edit';
      editBtn.innerHTML = '✏️ Edit';
      editBtn.onclick = () => editRecord(row);
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-delete';
      deleteBtn.innerHTML = '🗑️ Delete';
      deleteBtn.onclick = () => deleteRecord(row[tableConfigs[currentTable].id]);
      
      const btnContainer = document.createElement('div');
      btnContainer.className = 'action-buttons';
      btnContainer.appendChild(editBtn);
      btnContainer.appendChild(deleteBtn);
      
      actionTd.appendChild(btnContainer);
      tr.appendChild(actionTd);
      tableBody.appendChild(tr);
    });
  } catch (err) {
    console.error('Load table error:', err);
    tableBody.innerHTML = `<tr><td colspan="100" class="empty-state">❌ Error loading data</td></tr>`;
  }
}

/******************************
 NOTIFICATION SYSTEM
******************************/
function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

/******************************
 VALIDATION HELPER
******************************/
function validateData(record) {
  // Name validation (no numbers)
  const nameFields = ['first_name', 'last_name', 'f_name', 'l_name'];
  for (let field of nameFields) {
    if (record[field]) {
      if (!/^[A-Za-z\s\-']+$/.test(record[field])) {
        return `${field.replace(/_/g, ' ')} can only contain letters, spaces, hyphens, and apostrophes. No numbers!`;
      }
      if (record[field].trim().length < 2) {
        return `${field.replace(/_/g, ' ')} must be at least 2 characters long`;
      }
    }
  }

  // Email validation
  const emailFields = ['email', 'email_address'];
  for (let field of emailFields) {
    if (record[field]) {
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
      if (!emailRegex.test(record[field])) {
        return 'Please enter a valid email address (e.g., user@example.com)';
      }
    }
  }

  // Phone validation - UPDATED TO 11 DIGITS
  if (record['phone_number']) {
    const digitsOnly = record['phone_number'].replace(/\D/g, '');
    if (digitsOnly.length < 11) {
      return 'Phone number must contain at least 11 digits';
    }
  }

  // Age validation (client must be 13+)
  if (record['date_of_birth']) {
    const birthDate = new Date(record['date_of_birth']);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age < 13) {
      return 'Client must be at least 13 years old';
    }
  }

  // Nutrition validation
  if (record['calories_intake']) {
    if (record['calories_intake'] < 1000 || record['calories_intake'] > 5000) {
      return 'Calories must be between 1000 and 5000';
    }
  }

  if (record['protein_target']) {
    if (record['protein_target'] < 30 || record['protein_target'] > 500) {
      return 'Protein must be between 30g and 500g';
    }
  }

  if (record['carbs_target']) {
    if (record['carbs_target'] < 50 || record['carbs_target'] > 800) {
      return 'Carbs must be between 50g and 800g';
    }
  }

  if (record['fats_target']) {
    if (record['fats_target'] < 20 || record['fats_target'] > 300) {
      return 'Fats must be between 20g and 300g';
    }
  }

  return null; // No errors
}

/******************************
 ADD RECORD - FIXED
******************************/
async function addRecord() {
  const record = {};
  let hasValue = false;

  tableConfigs[currentTable].fields.forEach(field => {
    const input = document.getElementById(field);
    if (input && input.value.trim()) {
      let value = input.value.trim();
      
      if (input.type === 'number' && value) {
        value = parseFloat(value);
      }
      
      record[field] = value;
      hasValue = true;
    }
  });

  if (!hasValue) {
    showNotification('⚠️ Please fill in at least one field!');
    return;
  }

  // Client-side validation
  const validationError = validateData(record);
  if (validationError) {
    showNotification('⚠️ ' + validationError);
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from(currentTable)
      .insert(record)
      .select(); // Important: returns the inserted data

    if (error) {
      console.error('Insert error:', error);
      
      // Better error messages
      let userMessage = '❌ Error: ';
      if (error.message.includes('check constraint')) {
        if (error.message.toLowerCase().includes('name')) {
          userMessage += 'Names can only contain letters, spaces, hyphens, and apostrophes. No numbers!';
        } else if (error.message.toLowerCase().includes('email')) {
          userMessage += 'Please enter a valid email address';
        } else if (error.message.toLowerCase().includes('phone')) {
          userMessage += 'Phone number must be at least 11 digits';
        } else if (error.message.toLowerCase().includes('birth')) {
          userMessage += 'Client must be at least 13 years old';
        } else if (error.message.toLowerCase().includes('gender')) {
          userMessage += 'Gender must be M or F';
        } else if (error.message.toLowerCase().includes('calories')) {
          userMessage += 'Calories must be between 1000 and 5000';
        } else if (error.message.toLowerCase().includes('macro')) {
          userMessage += 'Macronutrients do not match calorie intake';
        } else {
          userMessage += error.message;
        }
      } else if (error.message.includes('unique') || error.message.includes('duplicate')) {
        userMessage += 'This email is already registered!';
      } else if (error.message.includes('foreign key') || error.message.includes('violates')) {
        userMessage += 'Invalid reference ID. Please check Admin/Coach/Client/Membership ID exists.';
      } else {
        userMessage += error.message;
      }
      
      showNotification(userMessage);
    } else {
      showNotification('✅ Record added successfully!');
      clearForm();
      // Force immediate reload
      await loadTable();
    }
  } catch (err) {
    console.error('Add record error:', err);
    showNotification('❌ Error adding record');
  }
}

/******************************
 EDIT RECORD
******************************/
function editRecord(record) {
  console.log('Editing record:', record);
  editingRecordId = record[tableConfigs[currentTable].id];
  console.log('Editing ID:', editingRecordId);
  
  const modal = document.getElementById('editModal');
  const editForm = document.getElementById('edit-form');
  editForm.innerHTML = '';

  tableConfigs[currentTable].fields.forEach(field => {
    const fieldValue = record[field] || '';
    
    // Gender dropdown - ONLY M and F
    if (field === 'gender') {
      const select = document.createElement('select');
      select.id = 'edit_' + field;
      select.innerHTML = `
        <option value="">Select Gender</option>
        <option value="M" ${fieldValue === 'M' ? 'selected' : ''}>Male</option>
        <option value="F" ${fieldValue === 'F' ? 'selected' : ''}>Female</option>
      `;
      editForm.appendChild(select);
    }
    // Membership Type dropdown
    else if (field === 'membership_type') {
      const select = document.createElement('select');
      select.id = 'edit_' + field;
      const types = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Semi-Annual', 'Yearly'];
      select.innerHTML = '<option value="">Select Type</option>';
      types.forEach(type => {
        select.innerHTML += `<option value="${type}" ${fieldValue === type ? 'selected' : ''}>${type}</option>`;
      });
      editForm.appendChild(select);
    }
    // Goal dropdown
    else if (field === 'goal') {
      const select = document.createElement('select');
      select.id = 'edit_' + field;
      const goals = ['Fat Loss', 'Muscle Gain', 'Hypertrophy', 'Strength', 'Endurance', 'Athletic Performance', 'General Fitness', 'Rehabilitation'];
      select.innerHTML = '<option value="">Select Goal</option>';
      goals.forEach(goal => {
        select.innerHTML += `<option value="${goal}" ${fieldValue === goal ? 'selected' : ''}>${goal}</option>`;
      });
      editForm.appendChild(select);
    }
    // Level dropdown
    else if (field === 'level') {
      const select = document.createElement('select');
      select.id = 'edit_' + field;
      const levels = ['Beginner', 'Intermediate', 'Advanced', 'Elite'];
      select.innerHTML = '<option value="">Select Level</option>';
      levels.forEach(level => {
        select.innerHTML += `<option value="${level}" ${fieldValue === level ? 'selected' : ''}>${level}</option>`;
      });
      editForm.appendChild(select);
    }
    // Regular input fields
    else {
      const input = document.createElement('input');
      input.placeholder = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      input.id = 'edit_' + field;
      
      if (field.includes('date')) {
        input.type = 'date';
        if (fieldValue) {
          input.value = fieldValue.split('T')[0];
        }
      } else if (field.includes('email')) {
        input.type = 'email';
        input.value = fieldValue;
      } else if (field.includes('phone')) {
        input.type = 'tel';
        input.value = fieldValue;
        input.placeholder = input.placeholder + ' (min 11 digits)';
      } else if (field.includes('_id') || field === 'duration' || field === 'duration_weeks' || 
                 field.includes('intake') || field.includes('target') || field === 'price') {
        input.type = 'number';
        input.step = field === 'price' ? '0.01' : '1';
        input.min = '0';
        input.value = fieldValue;
      } else {
        input.value = fieldValue;
      }
      
      editForm.appendChild(input);
    }
  });

  modal.classList.add('show');
}

/******************************
 UPDATE RECORD - FIXED
******************************/
async function updateRecord() {
  const record = {};
  let hasValue = false;

  tableConfigs[currentTable].fields.forEach(field => {
    const input = document.getElementById('edit_' + field);
    if (input && input.value.trim()) {
      let value = input.value.trim();
      
      if (input.type === 'number' && value) {
        value = parseFloat(value);
      }
      
      record[field] = value;
      hasValue = true;
    }
  });

  if (!hasValue) {
    showNotification('⚠️ Please modify at least one field!');
    return;
  }

  // Client-side validation
  const validationError = validateData(record);
  if (validationError) {
    showNotification('⚠️ ' + validationError);
    return;
  }

  console.log('Updating record:', record);
  console.log('Update ID:', editingRecordId);

  try {
    const { data, error } = await supabaseClient
      .from(currentTable)
      .update(record)
      .eq(tableConfigs[currentTable].id, editingRecordId)
      .select();

    if (error) {
      console.error('Update error:', error);
      
      let userMessage = '❌ Error: ';
      if (error.message.includes('check constraint')) {
        if (error.message.toLowerCase().includes('name')) {
          userMessage += 'Names can only contain letters. No numbers or special characters!';
        } else if (error.message.toLowerCase().includes('email')) {
          userMessage += 'Please enter a valid email address';
        } else if (error.message.toLowerCase().includes('phone')) {
          userMessage += 'Phone number must be at least 11 digits';
        } else {
          userMessage += error.message;
        }
      } else if (error.message.includes('unique')) {
        userMessage += 'This email is already registered!';
      } else {
        userMessage += error.message;
      }
      
      showNotification(userMessage);
    } else {
      showNotification('✅ Record updated successfully!');
      closeModal();
      await loadTable();
    }
  } catch (err) {
    console.error('Update error:', err);
    showNotification('❌ Error updating record');
  }
}

/******************************
 DELETE RECORD - FIXED
******************************/
async function deleteRecord(id) {
  console.log('Deleting record with ID:', id);
  
  if (!confirm('⚠️ Are you sure you want to delete this record? This action cannot be undone.')) {
    return;
  }

  try {
    const { error } = await supabaseClient
      .from(currentTable)
      .delete()
      .eq(tableConfigs[currentTable].id, id);

    if (error) {
      console.error('Delete error:', error);
      showNotification('❌ Error: ' + error.message);
    } else {
      showNotification('✅ Record deleted successfully!');
      await loadTable();
    }
  } catch (err) {
    console.error('Delete error:', err);
    showNotification('❌ Error deleting record');
  }
}

/******************************
 MODAL CONTROLS
******************************/
function closeModal() {
  document.getElementById('editModal').classList.remove('show');
  editingRecordId = null;
}

// Close modal when clicking outside
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('editModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target.id === 'editModal') {
        closeModal();
      }
    });
  }
});