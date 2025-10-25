import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Firestore, collectionGroup, query, where, getDocs, orderBy } from '@angular/fire/firestore';
import jsPDF from 'jspdf'; // Use default import
import { applyPlugin } from 'jspdf-autotable';
import { SchoolStateService } from '../../core/services/school-state.service';


@Component({
  selector: 'app-view-question-papers',
  imports: [CommonModule],
  templateUrl: './view-question-papers.html',
  styleUrl: './view-question-papers.scss'
})
export class ViewQuestionPapers implements OnInit {
  private firestore = inject(Firestore);
  private route = inject(ActivatedRoute);
  private schoolState = inject(SchoolStateService);

  schoolId: string | null = null;
  questionPapers: any[] = [];
  isLoading = true;
  errorMessage: string | null = null;

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.schoolId = params.get('schoolId');
      if (this.schoolId) {
        this.loadQuestionPapers();
      } else {
        this.errorMessage = "School ID not found in URL.";
        this.isLoading = false;
      }
    });
  }

  async loadQuestionPapers() {
    if (!this.schoolId) return;
    this.isLoading = true;
    const qpCollection = collectionGroup(this.firestore, 'question_papers');
    const q = query(
      qpCollection,
      where('schoolId', '==', this.schoolId),
      orderBy('createdAt', 'desc')
    );

    try {
      const querySnapshot = await getDocs(q);
      this.questionPapers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching question papers:", error);
      this.errorMessage = "Failed to load question papers. You may need to check Firestore indexes.";
    } finally {
      this.isLoading = false;
    }
  }

  async generatePdf(paper: any) {
    applyPlugin(jsPDF); // Apply the autotable plugin

    const doc = new jsPDF('p', 'mm', 'a4');
    const school = this.schoolState.currentSchool(); // Assumes school data is loaded

    // Add logo if it exists
    if (school?.logoUrl) {
      try {
        const response = await fetch(school.logoUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        const dataUrl = await new Promise(resolve => {
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
        doc.addImage(dataUrl as string, 'PNG', 15, 10, 20, 20);
      } catch (error) {
        console.error("Error adding school logo to PDF:", error);
      }
    }

    // Header
    doc.setFontSize(18);
    doc.text(school?.name || 'School Name', 105, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`Exam - ${paper.subject}`, 105, 30, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Class: ${paper.class}`, 15, 40);
    // You might need to fetch exam details like totalMarks and duration if they aren't on the paper document
    // doc.text(`Total Marks: ${paper.totalMarks}`, 105, 40, { align: 'center' });
    // doc.text(`Duration: ${paper.duration}`, 190, 40, { align: 'right' });
    doc.line(15, 45, 195, 45);

    // Questions using autoTable for better layout and page breaks
    const head = [['Q.No.', 'Question', 'Marks']];
    const body = paper.selectedQuestions.map((q: any, index: number) => {
      let questionText = q.question;
      if (q.options && q.options.length > 0) {
        questionText += '\n' + q.options.map((opt: string, i: number) => `(${String.fromCharCode(97 + i)}) ${opt}`).join('\n');
      }
      return [index + 1, questionText, q.marks || ''];
    });

    (doc as any).autoTable({
      startY: 50,
      head: head,
      body: body,
      theme: 'grid',
      styles: { cellPadding: 2, fontSize: 10 },
      headStyles: { fillColor: [22, 160, 133], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 15 }, 2: { cellWidth: 15, halign: 'center' } }
    });

    // Save the PDF
    doc.save(`${paper.class}_${paper.subject}_QuestionPaper.pdf`);
  }
}
