import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Firestore, collectionGroup, query, where, getDocs, orderBy } from '@angular/fire/firestore';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
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

  generatePdf(paper: any) {
    const doc = new jsPDF();
    const school = this.schoolState.currentSchool(); // Assumes school data is loaded

    // Header
    doc.setFontSize(18);
    doc.text(school?.name || 'School Name', 105, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`Exam - ${paper.subject}`, 105, 30, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Class: ${paper.class}`, 20, 40);
    // You might need to fetch exam details like totalMarks and duration if they aren't on the paper document
    // doc.text(`Total Marks: ${paper.totalMarks}`, 105, 40, { align: 'center' });
    // doc.text(`Duration: ${paper.duration}`, 190, 40, { align: 'right' });
    doc.line(20, 45, 190, 45);

    // Questions
    let y = 60;
    paper.selectedQuestions.forEach((q: any, index: number) => {
      if (y > 270) { // Check for page break
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(12);
      doc.text(`${index + 1}. ${q.question}`, 20, y, { maxWidth: 170 });
      y += (doc.splitTextToSize(q.question, 170).length * 7);


      if (q.options && q.options.length > 0) {
        doc.setFontSize(10);
        q.options.forEach((opt: string, i: number) => {
          doc.text(`   (${String.fromCharCode(97 + i)}) ${opt}`, 25, y);
          y += 6;
        });
      }
      y += 5; // Space between questions
    });

    // Save the PDF
    doc.save(`${paper.class}_${paper.subject}_QuestionPaper.pdf`);
  }
}
