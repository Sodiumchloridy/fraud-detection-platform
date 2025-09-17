import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-user-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './user-edit.component.html',
  styleUrls: []
})
export class UserEditComponent implements OnInit {
  user = {
    id: 0,
    name: '',
    email: '',
    role: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const userId = this.route.snapshot.paramMap.get('id');
    // In a real app, you'd fetch the user from a service based on the id
    // For this simulation, we'll just populate it with dummy data
    if (userId === '1') {
      this.user = { id: 1, name: 'Alice Johnson', email: 'alice.j@example.com', role: 'Administrator' };
    } else {
      this.user = { id: 2, name: 'Bob Williams', email: 'bob.w@example.com', role: 'Fraud Analyst' };
    }
  }

  saveChanges() {
    console.log('Saving changes for user:', this.user);
    alert('User account updated (simulation).');
    this.router.navigate(['/admin']);
  }

  deleteUser() {
    if (confirm('Are you sure you want to delete this user?')) {
      console.log('Deleting user:', this.user);
      alert('User account deleted (simulation).');
      this.router.navigate(['/admin']);
    }
  }
}

