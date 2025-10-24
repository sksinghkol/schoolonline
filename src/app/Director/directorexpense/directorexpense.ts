import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  Firestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  collectionData,
  where,
} from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { ActivatedRoute } from '@angular/router';
import { Observable, map } from 'rxjs';

// ✅ Excel & PDF libraries
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Expense {
  id?: string;
  date: Date;
  category: string;
  item_name: string;
  description?: string;
  amount: number;
  payment_mode: string;
  paid_to: string;
  invoice_no?: string;
  reference_no?: string;
  department?: string;
  approved_by?: string;
  status: 'Pending' | 'Approved' | 'Paid' | 'Cancelled';
  remarks?: string;
  created_by?: string;
  expense_month: string;
  attachment_url?: string;
  budget_head?: string;
  reimbursement_flag: boolean;
  created_at: Date;
  updated_at: Date;
}

@Component({
  selector: 'app-directorexpense',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './directorexpense.html',
  styleUrls: ['./directorexpense.scss'],
})
export class Directorexpense implements OnInit {
  private firestore: Firestore = inject(Firestore);
  private storage: Storage = inject(Storage);
  private fb: FormBuilder = inject(FormBuilder);
  private route: ActivatedRoute = inject(ActivatedRoute);

  expenseForm!: FormGroup;
  allExpenses: Expense[] = [];
  filteredExpenses: Expense[] = [];
  showForm = false;
  editingExpenseId: string | null = null;
  isSaving = false;
  schoolId: string | null = null;
  private selectedFile: File | null = null;

  // 🔹 Filters
  filterMonth = '';
  filterCategory = '';
  filterStatus = '';

  // 🔹 Summary
  totalExpenses = 0;
  monthlyTotals: { [month: string]: number } = {};

  constructor() {
    this.expenseForm = this.fb.group({
      date: ['', Validators.required],
      category: ['', Validators.required],
      item_name: ['', Validators.required],
      description: [''],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      payment_mode: ['Cash', Validators.required],
      paid_to: ['', Validators.required],
      invoice_no: [''],
      reference_no: [''],
      department: [''],
      budget_head: [''],
      remarks: [''],
      attachment_url: [''],
      reimbursement_flag: [false],
    });
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.schoolId = params.get('schoolId');
      if (this.schoolId) {
        const expensesCol = collection(this.firestore, `schools/${this.schoolId}/expenses`);
        const expensesQuery = query(expensesCol, orderBy('date', 'desc'));
        collectionData(expensesQuery, { idField: 'id' })
          .pipe(
            map((expenses: any[]) =>
              expenses.map((expense) => {
                if (expense.date && typeof expense.date.toDate === 'function') {
                  expense.date = expense.date.toDate();
                }
                return expense as Expense;
              })
            )
          )
          .subscribe((data) => {
            this.allExpenses = data;
            this.applyFilters();
            this.calculateTotals();
          });
      }
    });
  }

  // 🔹 Toggle form
  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.cancelEdit();
    }
  }

  // 🟢 Save or Update Expense
  async saveExpense(): Promise<void> {
    if (!this.schoolId || this.expenseForm.invalid) return;
    this.isSaving = true;

    const expenseData = this.expenseForm.value;
    expenseData.date = new Date(expenseData.date);
    expenseData.expense_month = expenseData.date.toLocaleString('default', { month: 'long', year: 'numeric' });
    expenseData.updated_at = new Date();
    expenseData.created_by = localStorage.getItem('user_name') || 'Director';

    try {
      // 🔹 Upload file if selected
      if (this.selectedFile) {
        const filePath = `expenses/${this.schoolId}/${Date.now()}_${this.selectedFile.name}`;
        const fileRef = ref(this.storage, filePath);
        const uploadResult = await uploadBytes(fileRef, this.selectedFile);
        const downloadUrl = await getDownloadURL(uploadResult.ref);
        expenseData.attachment_url = downloadUrl;
      }

      const expensesCol = collection(this.firestore, `schools/${this.schoolId}/expenses`);

      if (this.editingExpenseId) {
        const expenseDoc = doc(this.firestore, `schools/${this.schoolId}/expenses/${this.editingExpenseId}`);
        await updateDoc(expenseDoc, expenseData);
      } else {
        expenseData.created_at = new Date();
        expenseData.status = 'Pending';
        await addDoc(expensesCol, expenseData);
      }

      this.cancelEdit();
    } catch (error) {
      console.error('Error saving expense:', error);
    } finally {
      this.isSaving = false;
    }
  }

  // 🟠 Edit Expense
  editExpense(expense: Expense): void {
    this.showForm = true;
    this.editingExpenseId = expense.id || null;

    this.expenseForm.patchValue({
      date: expense.date ? new Date(expense.date).toISOString().substring(0, 10) : '',
      category: expense.category,
      item_name: expense.item_name,
      description: expense.description || '',
      amount: expense.amount,
      payment_mode: expense.payment_mode,
      paid_to: expense.paid_to,
      invoice_no: expense.invoice_no || '',
      reference_no: expense.reference_no || '',
      department: expense.department || '',
      budget_head: expense.budget_head || '',
      remarks: expense.remarks || '',
      attachment_url: expense.attachment_url || '',
      reimbursement_flag: expense.reimbursement_flag || false,
    });
  }

  cancelEdit(): void {
    this.editingExpenseId = null;
    this.expenseForm.reset();
    this.selectedFile = null;
    this.showForm = false;
  }

  // 🔴 Delete Expense
  async deleteExpense(expenseId: string | undefined): Promise<void> {
    if (!this.schoolId || !expenseId) return;
    const confirmDelete = confirm('Are you sure you want to delete this expense?');
    if (!confirmDelete) return;

    try {
      const expenseDoc = doc(this.firestore, `schools/${this.schoolId}/expenses/${expenseId}`);
      await deleteDoc(expenseDoc);
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  }

  // 🔵 Update Status
  async updateStatus(expense: Expense, status: Expense['status']): Promise<void> {
    if (!this.schoolId || !expense.id) return;
    try {
      const expenseDoc = doc(this.firestore, `schools/${this.schoolId}/expenses/${expense.id}`);
      await updateDoc(expenseDoc, {
        status: status,
        updated_at: new Date(),
      });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }

  // 📁 File Select
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.selectedFile = input.files[0];
    }
  }

  // 🏷️ Status Color
  getStatusClass(status: string): string {
    switch (status) {
      case 'Paid': return 'bg-success';
      case 'Approved': return 'bg-info';
      case 'Cancelled': return 'bg-danger';
      case 'Pending':
      default: return 'bg-warning';
    }
  }

  // 🔍 Apply Filters
  applyFilters(): void {
    this.filteredExpenses = this.allExpenses.filter((expense) => {
      return (
        (!this.filterMonth || expense.expense_month === this.filterMonth) &&
        (!this.filterCategory || expense.category === this.filterCategory) &&
        (!this.filterStatus || expense.status === this.filterStatus)
      );
    });
    this.calculateTotals();
  }

  // 💰 Calculate Totals
  calculateTotals(): void {
    this.totalExpenses = this.filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    this.monthlyTotals = {};
    for (let e of this.filteredExpenses) {
      const month = e.expense_month;
      this.monthlyTotals[month] = (this.monthlyTotals[month] || 0) + (e.amount || 0);
    }
  }

  // 🔹 Computed properties for unique filter options
  get uniqueMonths(): string[] {
    return [...new Set(this.allExpenses.map(e => e.expense_month))];
  }

  get uniqueCategories(): string[] {
    return [...new Set(this.allExpenses.map(e => e.category))];
  }

  // 📊 Export to Excel
  exportToExcel(): void {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.filteredExpenses);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
    XLSX.writeFile(wb, 'expenses.xlsx');
  }

  // 📄 Export to PDF
  exportToPDF(): void {
    const doc = new jsPDF();
    doc.text('Expense Report', 14, 15);
    autoTable(doc, {
      head: [['Date', 'Category', 'Item', 'Amount', 'Status']],
      body: this.filteredExpenses.map((e) => [
        new Date(e.date).toLocaleDateString(),
        e.category,
        e.item_name,
        e.amount.toFixed(2),
        e.status,
      ]),
    });
    doc.save('expenses.pdf');
  }
}
