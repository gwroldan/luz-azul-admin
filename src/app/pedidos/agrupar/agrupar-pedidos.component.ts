import { Component, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material';

import swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import * as XLSXStyle from 'xlsx-style';
import { saveAs } from 'file-saver';
import { NgxStepperComponent, StepperOptions } from 'ngx-stepper';
import { LocalDataSource } from 'ng2-smart-table';

import { DataService } from '../../services/data.service';

type AOA = any[][];

@Component({
  selector: 'app-agrupar-pedidos',
  templateUrl: './agrupar-pedidos.component.html',
  styleUrls: ['./agrupar-pedidos.component.scss']
})
export class AgruparPedidosComponent implements OnInit {
  // Properties DataTable
  private columns: Object = {
    codProducto: { title: 'Cod. Producto', editable: false },
    descripcion: { title: 'Descripcion', editable: false },
    cantPedida:  { title: 'Cant. Pedida', editable: true },
    cantReal:    { title: 'Cant. Real', editable: false },
    kgReales:    { title: 'Kg. Reales', editable: false },
    kgPedidos:   { title: 'Kg. Pedidos', editable: false },
    lote:        { title: 'Lote', editable: false }
  };
  public settingsTable = {
    attr: { class: 'table' },
    actions: { delete: false },
    hideSubHeader: true,
    columns: this.columns,
    edit: { confirmSave: true },
    pager: { display: false }
  };
  public sourceDataTable: LocalDataSource;

  // Propperties InputFile
  public inputFileModel: Array<any> = new Array<any>();
  public inputMaxFiles: number = 40;
  public inputAccept: string = '.xls,.xlsx';
  // private cabecera: AOA = [
  //     ['Empresa:', 'Ensemble SRL'],
  //     ['Fecha:', new Date()],
  //     [],
  //   ];
  private internalFileModel: Array<any> = new Array<any>(); // I need for disconetion of model when remove all files
  private internalFileErrors: Array<any> = new Array<any>();
  private fileName = 'PedidoAgrupado.xlsx';

  // Properties Stepper
  @ViewChild('stepperDemo')
  public steppers: NgxStepperComponent;
  public optionsStepper: StepperOptions = {
    vertical: false,
    linear: true,
    alternative: true,
    mobileStepText: false,
    enableSvgIcon: true,
    labelStep: 'Paso',
    labelOf: 'de'
  };

  public cantFilesLoad: number;
  public proveedores: string[];
  public proveedorSel: string;

  constructor(private _iconRegistry: MatIconRegistry,
              private _sanitizer: DomSanitizer,
              private dataService: DataService) {
    this.cantFilesLoad = this.dataService.getCantFilesLoad();
    this.proveedores = this.dataService.getProveedores();
    this.proveedorSel = this.proveedores[0];
  }

  public ngOnInit(): void {
    this._iconRegistry
      .addSvgIcon('step-done', this._sanitizer.bypassSecurityTrustResourceUrl('assets/icon/done.svg'));
    this._iconRegistry
      .addSvgIcon('step-warning', this._sanitizer.bypassSecurityTrustResourceUrl('assets/icon/warning.svg'));
  }

  // metodos para el manejo de datos
  private agruparDetalle(detalle) {
    detalle = detalle.sort();
    const detAgrupado: AOA = new Array(detalle.shift());
    let codProducto: string = detAgrupado[0][0];

    detalle.forEach((det) => {
      if (det[0] === codProducto) {
        const index = detAgrupado.length - 1;
        detAgrupado[index][2] = parseFloat(detAgrupado[index][2]) + parseFloat(det[2]);
        detAgrupado[index][5] = parseFloat(detAgrupado[index][5]) + parseFloat(det[5]);
      } else {
        codProducto = det[0];
        detAgrupado.push(det);
      }
    });

    detAgrupado.forEach((det) => {
      det[2] = parseFloat(det[2]).toFixed(0);
      det[5] = parseFloat(det[5]).toFixed(4);
    });

    return detAgrupado;
  }

  private readMultipleFiles = (files) => {
    let detalle: AOA;

    function readFile(file) {
      return new Promise(function(resolve, reject) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const bstr: string = e.target.result;
          const wb: XLSX.WorkBook = XLSX.read(bstr, {type: 'binary'});

          /* grab first sheet */
          const wsname: string = wb.SheetNames[0];
          const ws: XLSX.WorkSheet = wb.Sheets[wsname];

          /* save data */
          const tmp: AOA = <AOA>(XLSX.utils.sheet_to_json(ws, {header: 1}));
          const firstCell: string = tmp[0][0];
          let tmpData: AOA;

          if (firstCell.startsWith('Empresa')) {
            tmpData = tmp;
            tmpData.splice(0, tmpData.findIndex((row) => row[0] === 'Cod. Producto') + 1);
            tmpData.splice(tmpData.findIndex((row) => row[0] === undefined));
          }

          resolve(tmpData);
        };
        reader.onerror = (err) => {
          console.error('Fallo al leer el archivo ', file.file.name, ' Error: ', err);
          reject(err);
        };
        reader.readAsBinaryString(file.file);
      });
    }

    const promises = Array.from(files, function(file: any) {
      return readFile(file)
        .then(function(data: AOA) {
          if (detalle) {
            detalle = [...detalle, ...data];
          } else {
            detalle = data;
          }
        });
    });

    return Promise.all(promises)
      .then(function() {
        return detalle;
      })
      ;
  }

  private confirmNextStep(): void {
    this.readMultipleFiles(this.internalFileModel)
      .then((detalle: AOA) => {
        this.setSourceDataTable(this.agruparDetalle(detalle));
        this.steppers.next();
      })
      .catch((err) => {
        console.error('Ocurrio un error inesperado:', err);
      });
  }

  private setCabeceraWorkSheet(data: any[]): any[] {
    const cabecera = {
      codProducto: 'Cod. Producto',
      descripcion: 'Descripcion',
      cantPedida:  'Cant. Pedida',
      cantReal:    'Cant. Real',
      kgReales:    'Kg. Reales',
      kgPedidos:   'Kg. Pedidos',
      lote:        'Lote'
    };

    data.unshift(cabecera);
    return data;
  }

  private formatWorkSheet(ws: XLSX.WorkSheet) {
    const range = ws['!ref'];
    const firstCell = range.substr(0, range.indexOf(':'));
    const lastCell = range.substr(range.indexOf(':') + 1);
    const firstChar = firstCell.charAt(0);
    const lastChar = lastCell.charAt(0);
    const firstNumber: number = parseInt(firstCell.substr(1), 10);
    const lastNumber: number = parseInt(lastCell.substr(1), 10);

    let abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    abc = abc.substr(abc.indexOf(firstChar));
    abc = abc.substr(0, abc.indexOf(lastChar) + 1);
    const arrChar = Array.from(abc);

    // IMPORTANT: Not implemented in XLSXStyle
    const wsCols: any[] = [];
    const wsRows: any[] = [];
    wsRows.push({ hpt: 15.75 });
    for (let i = firstNumber; i < lastNumber; i++) {
      wsRows.push({ hpt: 30 });
    }
    ws['!rows'] = wsRows;

    // format data
    arrChar.forEach((element) => {
      let maxChars = 6;

      for (let i = firstNumber; i <= lastNumber; i++) {
        // Si es undefined lo pongo '' (vacio)
        ws[`${element}${i}`].v = (ws[`${element}${i}`].v === undefined ? '' : ws[`${element}${i}`].v);
        // Busco el valor con mas caracteres
        maxChars = (ws[`${element}${i}`].v.length > maxChars ? ws[`${element}${i}`].v.length : maxChars);

        // por defecto para todas las celdas
        ws[`${element}${i}`].t = 's'
        ws[`${element}${i}`].s = {
          font: { sz: 12 },
          border: {
            top: { style: 'thin', color: { auto: 1} },
            bottom: { style: 'thin', color: { auto: 1} },
            left: { style: 'thin', color: { auto: 1} },
            right: { style: 'thin', color: { auto: 1} },
          }
        };

        // formato cabecera
        if (i === firstNumber ) {
          ws[`${element}${i}`].s['fill'] = {
              bgColor: {indexed: 64},
              fgColor: {rgb: '00000000'},
              patternType: 'solid'
            };
          ws[`${element}${i}`].s['font']['color'] = {rgb: 'FFFFFF'};
          ws[`${element}${i}`].s['font']['bold'] = true;
          ws[`${element}${i}`].s['alignment'] = { horizontal: 'center' };
        }

        if (!isNaN(ws[`${element}${i}`].v) && element !== firstChar) {
          ws[`${element}${i}`].t = 'n';
          ws[`${element}${i}`].s['numFmt'] = '0.0000';
        }
      }

      // Agrego el ancho columna
      wsCols.push({ wch: maxChars + 2 });
    });

    ws['!cols'] = wsCols;
  }

  protected exportFile() {
    this.sourceDataTable.getAll()
      .then((data) => {
        swal({
          title: 'Esta Seguro?',
          text: 'Desea exportar los datos seleccionados?',
          type: 'question',
          showCancelButton: true,
          confirmButtonText: 'Exportar',
          cancelButtonText: 'Cancelar',
          showLoaderOnConfirm: true,
          preConfirm: () => {
            return new Promise((resolve) => {
              this.steppers.next();

              setTimeout(() => {
                /* generate worksheet */
                const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(this.setCabeceraWorkSheet(data), { skipHeader: true });
                this.formatWorkSheet(ws);

                /* generate workbook and add the worksheet */
                const wb: XLSX.WorkBook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

                /* save to file */
                // XLSX.writeFile(wb, this.fileName,  { cellStyles: true });
                const wbout = XLSXStyle.write(wb, { bookType: 'xlsx', bookSST: false, type: 'binary' });

                function s2ab(s) {
                  const buf = new ArrayBuffer(s.length);
                  const view = new Uint8Array(buf);
                  for (let i = 0; i !== s.length; ++i) { view[i] = s.charCodeAt(i) & 0xFF; }
                  return buf;
                }

                saveAs(new Blob([s2ab(wbout)], { type: '' }), this.fileName);

                resolve();
              }, 1000);
            });
          },
          allowOutsideClick: () => !swal.isLoading()
        }).then((result) => {
          if (result.value) {
            swal({
              title: 'Agrupado',
              text: 'Los pedidos se agruparon con exito.',
              type: 'success',
            }).then(() => {
              window.location.reload();
            });
          }
        });
      });
  }

  // metodos para inputFile
  public onAccept(file: any): void {
    console.log('accept');

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, {type: 'binary'});

      /* grab first sheet */
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];

      /* save data */
      const tmp: AOA = <AOA>(XLSX.utils.sheet_to_json(ws, {header: 1}));
      const proveedorCell: string = tmp[3][1];

      if (proveedorCell.toUpperCase() !== this.proveedorSel.toUpperCase()) {
        this.internalFileErrors.push(file);
      } else {
        this.internalFileModel.push(file);
      }
    };

    reader.readAsBinaryString(file.file);
  }

  public onRemove(file: any): void {
    console.log('remove');
    const indexFileModel = this.internalFileModel.indexOf(file);
    const indexFileError = this.internalFileErrors.indexOf(file);

    if (indexFileModel !== -1) { this.internalFileModel.splice(indexFileModel, 1); }
    if (indexFileError !== -1) { this.internalFileErrors.splice(indexFileError, 1); }
  }

  public onLimit(): void {
    console.log('limit');
    swal({
      type: 'info',
      title: 'Limite',
      text: `Solo se pueden cargar hasta ${this.inputMaxFiles} archivos!`
    });
  }

  public onReject(): void {
    console.log('reject');
    swal({
      type: 'warning',
      title: 'Archivo Invalido',
      html: `Solo se pueden cargar archivos con extension <b>${this.inputAccept}</b>!`
    });
  }

  // metodos Stepper
  public previousStep(): void {
    this.steppers.back();
  }

  public nextStepFile(): void {
    this.steppers.next();
  }

  public nextStepExport(): void {
    if (this.internalFileErrors.length > 0) {
      let nameFiles = '<ul>';
      for (let i = 0; i < this.internalFileErrors.length; i++) {
        nameFiles = nameFiles + `<li><b>${this.internalFileErrors[i].file.name}</b></li>`;
      }
      nameFiles = nameFiles + '</ul>';

      console.log(nameFiles);
      swal({
        type: 'error',
        title: 'Archivos invalidos',
        html: `<p>Los siguientes archivos no pertenecen al proveedor seleccionado:<p>
              ${nameFiles}
              Debe quitarlos para poder seguir adelante.`,
      })

      return;
    }

    if (this.internalFileModel.length > 1) {
      this.steppers.clearError();

      if (this.internalFileModel.length !== this.cantFilesLoad) {
        swal({
          title: 'Esta Seguro?',
          text: `Deberian ser ${this.cantFilesLoad} pedidos para este Deposito. Desea seguir adelante de todas formas?`,
          type: 'question',
          showCancelButton: true,
          cancelButtonText: 'No',
          confirmButtonText: 'Continuar'
        }).then((result) => {
          if (result.value) {
            this.confirmNextStep();
          }
        });
      } else {
        this.confirmNextStep();
      }
    } else {
      this.steppers.error('Debe seleccionar al menos 2 pedidos');
    }
  }

  // metodos DataTable
  private setSourceDataTable(detalle: AOA) {
    const keys = Object.keys(this.columns);
    const detDataTable: any[] = [];

    for (let i = 0; i < detalle.length; i++) {
      const row = detalle[i];
      const regTable: any = {};

      for (let j = 0; j < row.length; j++) {
        regTable[keys[j]] = row[j];
      }
      regTable['lote'] = '';

      detDataTable.push(regTable);
    }

    this.sourceDataTable = new LocalDataSource(detDataTable);
  }

  public checkUpdateRowDataTable(event: any) {
    const cantPedida = event.newData.cantPedida;
    const valid: boolean = (cantPedida && cantPedida !== '' && !isNaN(cantPedida) && (cantPedida % 1 === 0) && (cantPedida > 0));

    if (valid) {
      event.newData.cantPedida = parseFloat(cantPedida).toFixed(0);
      event.newData.kgPedidos = ((event.data.kgPedidos / event.data.cantPedida) * event.newData.cantPedida).toFixed(4);
      this.sourceDataTable.update(event.data, event.newData)
        .then(() => {
          this.sourceDataTable.refresh();
          event.confirm.resolve();
        });
    } else {
      swal(
        'Error',
        'Debe ingresar un número entero mayor a 0.',
        'error'
      )
      event.confirm.reject();
    }
  }

  // metodos SelProveedor
  public SelectProveedor(proveedor: any) {
    this.proveedorSel = proveedor;
  }

}
