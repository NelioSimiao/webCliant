class UserController {
  constructor(formIdCreate, formIdUpdate, tableId) {
    this.formE1 = document.getElementById(formIdCreate);
    this.formUpdateE1 = document.getElementById(formIdUpdate);
    this.tableIdE1 = document.getElementById(tableId);
    this.onSubmit();
    this.onEditCancel();
    this.selectAll();
  }

  onEditCancel() {
    document
      .querySelector("#box-user-update .btn-cancel")
      .addEventListener("click", e => {
        this.showCreateUser();
      });

    this.formUpdateE1.addEventListener("submit", event => {
      event.preventDefault();
      let btn = this.formUpdateE1.querySelector("[type=submit]");
      btn.disabled = true;
      let values = this.getValues("#form-user-update [name]");

      let index = this.formUpdateE1.dataset.trIndex;

      let tr = this.tableIdE1.rows[index];

      let userOld = JSON.parse(tr.dataset.user);

      let result = Object.assign({}, userOld, values);

      //  tr.dataset.user = JSON.stringify(result);

      this.getPhoto(this.formUpdateE1).then(
        content => {
          if (values._photo == "") {
            result._photo = userOld._photo;
          } else {
            result._photo = content;
          }

          let user = new User();
          user.onloadFromJSON(result);
          // salva na base
          user.save().then(user => {
            this.getTr(user, tr);
            this.updateCount();
            this.formUpdateE1.reset();
            btn.disabled = false;
            this.showCreateUser();
          });
        },
        function(e) {
          console.error(e);
        }
      );
    });
  }
  onSubmit() {
    this.formE1.addEventListener("submit", event => {
      event.preventDefault();
      let btn = this.formE1.querySelector("[type=submit]");
      btn.disabled = true;
      let values = this.getValues("#form-user-create [name]");
      // aqui é quando se para as validações
      if (!values) {
        btn.disabled = false;
        return false;
      }

      this.getPhoto(this.formE1).then(
        content => {
          values.photo = content;
          values.save().then(user => {
            this.addLine(user);
            this.formE1.reset();
            btn.disabled = false;
          });
        },

        function(e) {
          console.error(e);
        }
      );
    });
  }

  // para fazer up
  getPhoto(formE1) {
    return new Promise((resolve, reject) => {
      let fileReader = new FileReader();
      let elements = [...formE1.elements].filter(item => {
        if (item.name === "photo") {
          return item;
        }
      });
      let file = elements[0].files[0];

      fileReader.onload = () => {
        resolve(fileReader.result);
      };

      fileReader.onerror = e => {
        reject(e);
      };

      if (file) {
        fileReader.readAsDataURL(file);
      } else {
        resolve("dist/img/boxed-bg.jpg");
      }
    });
  }

  // extraindo dados do formulario
  getValues(formID) {
    let user = {};
    let isValid = true;
    this.getElements(formID).forEach(function(field, index) {
      if (
        ["name", "email", "password"].indexOf(field.name) > -1 &&
        !field.value
      ) {
        field.parentElement.classList.add("has-error");
        isValid = false;
      }

      if (field.name == "gender") {
        if (field.checked) {
          user[field.name] = field.value;
        }
      }
      if (field.name == "admin") {
        user[field.name] = field.checked;
      } else {
        user[field.name] = field.value;
      }
    });
    if (!isValid) {
      return false;
    }

    return new User(
      user.name,
      user.gender,
      user.birth,
      user.country,
      user.email,
      user.password,
      user.photo,
      user.admin
    );
  }

  selectAll() {
    User.getUserStorage().then(data => {
      data.users.forEach(dataUser => {
        let user = new User();
        user.onloadFromJSON(dataUser);
        this.addLine(user);
      });
    });
  }
  // adicionando linha na tabela dos usuarios
  addLine(dataUser) {
    let tr = this.getTr(dataUser);

    this.tableIdE1.appendChild(tr);

    this.updateCount();
  }

  getTr(dataUser, tr = null) {
    if (tr === null) tr = document.createElement("tr");
    tr.dataset.user = JSON.stringify(dataUser);

    tr.innerHTML = `<td><img src="${
      dataUser.photo
    }" alt="User Image" class="img-circle img-sm"> </td>
                    <td>${dataUser.name}</td>
                    <td>${dataUser.email}</td>
                    <td>${dataUser.admin ? "Sim" : "Não"}</td>
                    <td>${Utils.dateFormat(dataUser.register)}</td>
                    <td>
                    <button type="button" class="btn btn-primary btn-edit btn-xs btn-flat">Editar</button>
                    <button type="button" class="btn btn-danger btn-delete btn-xs btn-flat">Excluir</button>
                     </td>`;

    this.addEventsTr(tr);
    return tr;
  }

  updateCount() {
    let numberUsers = 0;
    let numberAdmin = 0;
    [...this.tableIdE1.children].forEach(tr => {
      numberUsers++;
      let user = JSON.parse(tr.dataset.user);
      if (user._admin) {
        numberAdmin++;
      }
    });
    document.getElementById("number-users").innerHTML = numberUsers;
    document.getElementById("number-users-admin").innerHTML = numberAdmin;
  }

  showCreateUser() {
    document.querySelector("#box-user-create").style.display = "block";
    document.querySelector("#box-user-update").style.display = "none";
  }

  showEditUser() {
    document.querySelector("#box-user-update").style.display = "block";
    document.querySelector("#box-user-create").style.display = "none";
  }

  getElements(id) {
    return document.querySelectorAll(id);
  }
  //adiciona o evento editar no botao da linha
  addEventsTr(tr) {
    tr.querySelector(".btn-delete").addEventListener("click", e => {
      if (confirm("Deseja realmente excluir ?")) {
        let user = new User();
        user.onloadFromJSON(JSON.parse(tr.dataset.user));
        //remove na base
        user.remove().then(data => {
          tr.remove();
          this.updateCount();
        });
      }
    });
    tr.querySelector(".btn-edit").addEventListener("click", e => {
      let json = JSON.parse(tr.dataset.user);
      //guardando o index
      this.formUpdateE1.dataset.trIndex = tr.sectionRowIndex;

      //Laço para percorrer objetos.
      for (let name in json) {
        let field = this.formUpdateE1.querySelector(
          "[name=" + name.replace("_", "") + "]"
        );
        if (field) {
          switch (field.type) {
            case "file":
              continue;
              break;
            case "radio":
              field = this.formUpdateE1.querySelector(
                "[name=" + name.replace("_", "") + "][value=" + json[name] + "]"
              );
              field.checked = true;
              break;
            case "checkbox":
              field.checked = json[name];
              break;
          }
          field.value = json[name];
        }
      }
      this.formUpdateE1.querySelector(".photo").src = json._photo;

      this.showEditUser();
    });
  }
}
